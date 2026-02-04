// Usa la instancia _supabase inicializada en index.html
// Las constantes SUPABASE_URL, SUPABASE_KEY y _supabase ya están definidas globalmente

// Verificar que _supabase esté disponible
if (typeof _supabase === 'undefined' || !_supabase) {
  console.error("supabase-service.js: _supabase no está inicializado. Asegúrate de que index.html defina _supabase antes de cargar este script.");
}

const supabaseService = {
  async getBootstrap() {
    try {
      const { data: workspaces, error: wsErr } = await _supabase.from('workspaces').select('*');
      if (wsErr) throw wsErr;

      const { data: responsables, error: respErr } = await _supabase.from('responsables').select('*');
      if (respErr) throw respErr;

      const { data: tareas, error: tErr } = await _supabase.from('tareas').select('*').order('id', {
        ascending: false
      });
      if (tErr) throw tErr;

      let customFields = [];
      try {
        const { data, error: cfErr } = await _supabase.from('custom_fields').select('*').order('order');
        if (!cfErr && data) customFields = data;
      } catch (err) {
        console.warn("Custom fields table not found - this is optional");
      }

      return {
        ok: true,
        workspaces: (workspaces || []).map(w => ({ ...w, id: w.id })),
        responsables: responsables || [],
        tareas: (tareas || []).map(t => ({
          ...t,
          workspaceId: t.workspace_id,
          responsableEmail: t.responsable_email,
          fechaTermino: t.fecha_termino,
          fechaCierre: t.fecha_cierre,
          customFields: t.custom_fields,
          clientRequestId: t.client_request_id,
          adjuntos: Array.isArray(t.adjuntos) ? t.adjuntos : []
        })),
        customFields: customFields
      };
    } catch (err) {
      console.error("Bootstrap error:", err);
      return { ok: false, error: err.message };
    }
  },

  async upsertWorkspace(ws) {
    const payload = {
      nombre: ws.nombre,
      activo: ws.activo !== false
    };
    if (ws.id) {
      payload.id = ws.id;
    }

    const { data, error } = await _supabase
      .from('workspaces')
      .upsert(payload)
      .select()
      .single();

    return { ok: !error, data: data, error: error?.message };
  },

  async upsertTarea(task) {
    console.log("SupabaseService.upsertTarea - Input:", task);
    const payload = {
      workspace_id: task.workspaceId,
      nombre: task.nombre,
      descripcion: task.descripcion,
      responsable_email: task.responsableEmail || null,
      estado: task.estado,
      creada: task.creada,
      modificada: task.modificada,
      fecha_termino: task.fechaTermino || null,
      fecha_cierre: task.fechaCierre || null,
      custom_fields: task.customFields || {},
      client_request_id: task.clientRequestId,
      adjuntos: task.adjuntos || []
    };
    if (task.id && task.id !== 0) payload.id = task.id;
    console.log("SupabaseService.upsertTarea - Payload:", payload);

    const { data, error } = await _supabase
      .from('tareas')
      .upsert(payload, { onConflict: 'client_request_id' })
      .select()
      .single();

    if (error) {
      console.error("SupabaseService.upsertTarea - Error:", error);
      return { ok: false, error: error.message };
    }

    console.log("SupabaseService.upsertTarea - Success:", data);
    return {
      ok: true,
      data: {
        ...data,
        workspaceId: data.workspace_id,
        responsableEmail: data.responsable_email,
        fechaTermino: data.fecha_termino,
        fechaCierre: data.fecha_cierre,
        customFields: data.custom_fields,
        clientRequestId: data.client_request_id,
        adjuntos: data.adjuntos || []
      }
    };
  },

  async deleteTarea(id) {
    const { error } = await _supabase.from('tareas').delete().eq('id', id);
    return { ok: !error, id: id, error: error?.message };
  },

  async upsertResponsable(resp) {
    const { data, error } = await _supabase
      .from('responsables')
      .upsert({ email: resp.email, nombre: resp.nombre, activo: resp.activo !== false })
      .select()
      .single();
    return { ok: !error, data: data, error: error?.message };
  },

  async setResponsableActive(email, active) {
    const { data, error } = await _supabase
      .from('responsables')
      .update({ activo: !!active })
      .eq('email', email)
      .select()
      .single();
    return { ok: !error, data: data, error: error?.message };
  },

  async upsertCustomField(field) {
    const { data, error } = await _supabase
      .from('custom_fields')
      .upsert({ id: field.id, name: field.name, type: field.type, order: field.order })
      .select()
      .single();
    return { ok: !error, data: data, error: error?.message };
  },

  async deleteCustomField(id) {
    const { error } = await _supabase.from('custom_fields').delete().eq('id', id);
    return { ok: !error, error: error?.message };
  },

  async uploadTaskAttachments(taskId, files) {
    try {
      const added = [];
      for (const f of files) {
        const originalName = f.name;
        const mimeType = f.mimeType;
        const b64 = f.dataBase64;

        const sanitizedName = originalName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');

        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        const path = `${taskId}/${Date.now()}_${sanitizedName}`;
        const { data, error } = await _supabase.storage
          .from('task-attachments')
          .upload(path, blob);

        if (error) throw error;

        const { data: { publicUrl } } = _supabase.storage
          .from('task-attachments')
          .getPublicUrl(path);

        added.push({
          id: data.path,
          name: originalName,
          url: publicUrl,
          mimeType: mimeType,
          created: new Date().toISOString()
        });
      }

      const { data: task, error: getErr } = await _supabase
        .from('tareas')
        .select('adjuntos')
        .eq('id', taskId)
        .single();

      if (getErr) throw getErr;

      const currentAdj = Array.isArray(task.adjuntos) ? task.adjuntos : [];
      const merged = currentAdj.concat(added);

      const { error: updErr } = await _supabase
        .from('tareas')
        .update({ adjuntos: merged })
        .eq('id', taskId);

      if (updErr) throw updErr;

      return { ok: true, data: merged };
    } catch (err) {
      console.error("Upload error:", err);
      return { ok: false, error: err.message };
    }
  },

  async deleteTaskAttachment(taskId, fileId) {
    try {
      const { error: delErr } = await _supabase.storage
        .from('task-attachments')
        .remove([fileId]);

      if (delErr) console.warn("Error eliminando archivo físico:", delErr);

      const { data: task, error: getErr } = await _supabase
        .from('tareas')
        .select('adjuntos')
        .eq('id', taskId)
        .single();

      if (getErr) throw getErr;

      const currentAdj = Array.isArray(task.adjuntos) ? task.adjuntos : [];
      const remaining = currentAdj.filter(a => a.id !== fileId);

      const { error: updErr } = await _supabase
        .from('tareas')
        .update({ adjuntos: remaining })
        .eq('id', taskId);

      if (updErr) throw updErr;

      return { ok: true, data: remaining };
    } catch (err) {
      console.error("Delete attachment error:", err);
    }
  },

  async deleteWorkspace(id) {
    const { error } = await _supabase.from('workspaces').delete().eq('id', id);
    return { ok: !error, id: id, error: error?.message };
  },

  async moveTasksToWorkspace(sourceWsId, targetWsId) {
    const { error } = await _supabase.from('tareas').update({ workspace_id: targetWsId }).eq('workspace_id', sourceWsId);
    return { ok: !error, error: error?.message };
  },

  // ===== AUTH METHODS =====
  async authSignUp(email, password, data = {}) {
    const { data: res, error } = await _supabase.auth.signUp({
      email,
      password,
      options: { data }
    });
    return { ok: !error, data: res, error: error?.message };
  },

  async authSignIn(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    return { ok: !error, data, error: error?.message };
  },

  async authSignOut() {
    const { error } = await _supabase.auth.signOut();
    return { ok: !error, error: error?.message };
  },

  async authResetPassword(email) {
    const { error } = await _supabase.auth.resetPasswordForEmail(email);
    return { ok: !error, error: error?.message };
  },

  async authGetSession() {
    const { data, error } = await _supabase.auth.getSession();
    return { ok: !error, session: data?.session, error: error?.message };
  },

  async authGetUser() {
    const { data, error } = await _supabase.auth.getUser();
    return { ok: !error, user: data?.user, error: error?.message };
  },

  async createUserInResponsables(email, nombre, rol = 'user') {
    // Busca si ya existe
    const { data: existing } = await _supabase.from('responsables').select('*').eq('email', email).single();
    if (existing) return { ok: true, data: existing };

    // Crea si no existe
    const { data, error } = await _supabase.from('responsables').insert({
      email,
      nombre,
      activo: true,
      rol
    }).select().single();

    return { ok: !error, data, error: error?.message };
  },

  async getUserRole(email) {
    if (!email) return { role: 'user' };
    try {
      const { data, error } = await _supabase
        .from('responsables')
        .select('rol')
        .ilike('email', email) // ilike para case-insensitive
        .single();

      if (error || !data) return { role: 'user' };
      return { role: data.rol || 'user' };
    } catch (e) {
      console.error("Error getting role", e);
      return { role: 'user' };
    }
  }
};

// Exponer en el objeto global por compatibilidad con scripts que esperan `window.supabaseService`
if (typeof window !== 'undefined') {
  window.supabaseService = supabaseService;
}
