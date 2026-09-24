import React, { useState } from 'react';
import { Employee } from '../types';
import {
  Users,
  Plus,
  MessageSquare,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Copy,
  Trash2,
  Edit2,
  Phone,
  Mail,
  Award,
  X,
  UserCheck,
  Building,
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSelectEmployeeAsActiveTechnician?: (employee: Employee) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [puesto, setPuesto] = useState('');
  const [sucursal, setSucursal] = useState('Guadalajara (Matriz)');
  const [cedulaTecnica, setCedulaTecnica] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const special = '#@$!*';

    let result = 'Sotex#';
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 6; i++) {
      result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    setPassword(result);
    setShowPassword(true);
  };

  const openNewModal = () => {
    setEditingId(null);
    setNombre('');
    setCorreo('');
    setTelefono('');
    setPuesto('Técnico de Servicio');
    setSucursal('Guadalajara (Matriz)');
    setCedulaTecnica(`TEC-SOT-${String(employees.length + 1).padStart(2, '0')}`);
    // Auto generate secure initial password
    const initialPass = `Sotex#${Math.floor(1000 + Math.random() * 9000)}*T`;
    setPassword(initialPass);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setNombre(emp.nombre);
    setCorreo(emp.correo);
    setTelefono(emp.telefono);
    setPuesto(emp.puesto);
    setSucursal(emp.sucursal);
    setCedulaTecnica(emp.cedulaTecnica);
    setPassword(emp.password || 'Sotex#2024*T');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;

    if (editingId) {
      const existing = employees.find((e) => e.id === editingId);
      if (existing) {
        onUpdateEmployee({
          ...existing,
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim(),
          puesto: puesto.trim(),
          sucursal: sucursal.trim(),
          cedulaTecnica: cedulaTecnica.trim(),
          password: password.trim(),
        });
      }
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        puesto: puesto.trim() || 'Técnico de Servicio',
        sucursal: sucursal.trim() || 'Guadalajara (Matriz)',
        cedulaTecnica: cedulaTecnica.trim() || `TEC-SOT-${String(employees.length + 1).padStart(2, '0')}`,
        password: password.trim() || 'Sotex#2024*T',
        activo: true,
        fechaRegistro: new Date().toISOString().split('T')[0],
      };
      onAddEmployee(newEmp);
    }
    setIsModalOpen(false);
  };

  const buildWhatsAppLink = (emp: Employee) => {
    // Format phone: remove spaces, dashes, parentheses
    const digitsOnly = emp.telefono.replace(/\D/g, '');
    let finalPhone = digitsOnly;
    if (digitsOnly.length === 10) {
      finalPhone = `52${digitsOnly}`;
    }

    const message = `¡Hola *${emp.nombre}*!\n\nAquí tienes tus credenciales de acceso al Sistema SOTEX:\n\n👤 *Rol:* Técnico de Servicio\n📧 *Usuario:* ${emp.correo}\n🔑 *Contraseña:* ${emp.password || 'Sotex#2024*T'}\n🆔 *ID Técnico:* ${emp.cedulaTecnica}\n\n📲 *Acceso al sistema:*\nhttps://sotex.vercel.app/\n\nPor favor guarda este mensaje para el registro de tus reportes de servicio en campo.`;

    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
  };

  const handleCopyCredentials = (emp: Employee) => {
    const text = `SOTEX - Credenciales de Técnico\nNombre: ${emp.nombre}\nUsuario: ${emp.correo}\nContraseña: ${emp.password || 'Sotex#2024*T'}\nID: ${emp.cedulaTecnica}\nLink: https://sotex.vercel.app/`;
    navigator.clipboard.writeText(text);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#D60000]" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Empleados y Técnicos
          </h2>
          <span className="bg-red-100 text-red-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
            {employees.length} Registrados
          </span>
        </div>

        <button
          id="btn-alta-empleado"
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D60000] hover:bg-[#b50000] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Dar de Alta Empleado</span>
        </button>
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const waLink = buildWhatsAppLink(emp);
          return (
            <div
              key={emp.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              {/* Header card info */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                      {emp.fotoUrl ? (
                        <img
                          src={emp.fotoUrl}
                          alt={emp.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        emp.nombre.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {emp.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">{emp.puesto}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emp.activo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {emp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.correo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.telefono || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.sucursal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {emp.cedulaTecnica}
                    </span>
                  </div>
                </div>

                {/* Password preview */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-md">
                  <span className="text-[11px] text-slate-500 font-medium">Contraseña:</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    {emp.password || '••••••••'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* WhatsApp Share Button */}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  title="Compartir credenciales por WhatsApp"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={() => handleCopyCredentials(emp)}
                  title="Copiar credenciales"
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedId === emp.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditModal(emp)}
                  title="Editar empleado"
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Deseas eliminar a ${emp.nombre}?`)) {
                      onDeleteEmployee(emp.id);
                    }
                  }}
                  title="Eliminar empleado"
                  className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Alta / Edición de Empleado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D60000]" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingId ? 'Editar Empleado' : 'Dar de Alta Empleado'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Nombre */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Tec. Daniel Ramírez"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Correo */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tecnico@sotex.com.mx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Teléfono WhatsApp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp (10 dígitos) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 3336108820"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Puesto */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Puesto / Especialidad
                  </label>
                  <input
                    type="text"
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    placeholder="Ej. Técnico de Impresoras"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Sucursal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sucursal
                  </label>
                  <input
                    type="text"
                    value={sucursal}
                    onChange={(e) => setSucursal(e.target.value)}
                    placeholder="Guadalajara (Matriz)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Cédula Técnica / ID */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    ID Técnico / Cédula SOTEX
                  </label>
                  <input
                    type="text"
                    value={cedulaTecnica}
                    onChange={(e) => setCedulaTecnica(e.target.value)}
                    placeholder="TEC-SOT-04"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900"
                  />
                </div>

                {/* Campo de Contraseña con Ojito y Generador */}
                <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Contraseña de Acceso *
                    </label>
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D60000] hover:text-[#b50000] cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Generar contraseña segura</span>
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña segura"
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D60000] focus:outline-hidden text-slate-900 font-mono text-xs"
                    />
                    {/* Botón de Ojito (Mostrar / Ocultar) */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="absolute right-2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Enlace de acceso automático: https://sotex.vercel.app/</span>
                    <span className="font-semibold text-emerald-600">Segura</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#D60000] hover:bg-[#b50000] rounded-lg shadow-xs active:scale-95 cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
