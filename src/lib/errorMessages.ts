const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Credenciales inválidas. Verifica tu correo y contraseña.",
  "Email not confirmed": "Correo no verificado. Por favor confirma tu correo para iniciar sesión.",
  "User already registered": "Este correo ya está registrado. Intenta iniciar sesión o recupera tu contraseña.",
  "User not found": "Usuario no encontrado. Verifica tu correo o regístrate.",
  "Invalid email": "Correo electrónico inválido.",
  "Password too short": "La contraseña es muy corta. Mínimo 6 caracteres.",
  "Email already registered": "Este correo ya está registrado. Intenta iniciar sesión.",
  "Signup requires a valid password": "Se requiere una contraseña válida.",
  "Signup requires a valid email": "Se requiere un correo electrónico válido.",
  "Unable to validate email address: Invalid format": "El formato del correo electrónico es inválido.",
  "Not authorized": "No autorizado. No tienes permiso para realizar esta acción.",
  "Auth session missing": "Sesión expirada. Por favor inicia sesión nuevamente.",
  "Auth invalid credentials": "Credenciales inválidas. Verifica tu correo y contraseña.",
  "Auth invalid email": "Correo electrónico inválido.",
  "Auth invalid password": "Contraseña inválida.",
  "Invalid refresh token": "Token de actualización inválido. Por favor inicia sesión nuevamente.",
  "Failed to parse email link": "Error al procesar el enlace de correo. Solicita uno nuevo.",
  "Invalid verification token": "Token de verificación inválido o expirado.",
  "Token expired": "El token ha expirado. Solicita uno nuevo.",
  "Reset password failed": "Error al restablecer la contraseña. Solicita un nuevo enlace.",
  "Update failed": "Error al actualizar. Por favor intenta de nuevo.",
  "No data": "No se encontró información.",
  "Duplicate table": "Ya existe un registro con estos datos.",
  "Unique constraint violation": "Ya existe un registro con estos datos.",
  "Foreign key violation": "Referencia inválida. Verifica los datos.",
  "Not null violation": "Este campo es requerido.",
  "Check constraint violation": "Validación fallida. Verifica los datos.",
  "Database error": "Error de base de datos. Contacta al soporte.",
  "Rate limit exceeded": "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
  "Request rate limit exceeded": "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
  "Invalid API key": "API key inválido.",
  "Missing authorization header": "Cabecera de autorización requerida.",
  "PGRST204": "Columna no encontrada. Contacta al soporte.",
  "PGRST202": "Error de permisos. Contacta al soporte.",
  "23505": "Este registro ya existe.",
  "23503": "No se puede eliminar. Este registro está siendo usado.",
  "23502": "Este campo es requerido.",
  "23514": "Validación fallida. Verifica los datos.",
};

export const translateError = (error: string | Error | null | undefined): string => {
  if (!error) return "Error desconocido. Por favor intenta de nuevo.";

  const errorMessage = typeof error === 'string' ? error : error.message || '';

  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("already")) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }

  if (errorMessage.toLowerCase().includes("invalid login credentials")) {
    return "Credenciales inválidas. Verifica tu correo y contraseña.";
  }

  if (errorMessage.toLowerCase().includes("already registered")) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }

  if (errorMessage.toLowerCase().includes("password")) {
    return "Contraseña inválida. Mínimo 6 caracteres.";
  }

  if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("invalid")) {
    return "Correo electrónico inválido.";
  }

  if (errorMessage.toLowerCase().includes("rate limit")) {
    return "Demasiadas solicitudes. Espera un momento e intenta de nuevo.";
  }

  return errorMessage;
};

export default translateError;