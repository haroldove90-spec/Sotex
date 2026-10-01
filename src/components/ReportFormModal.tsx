import React, { useState, useEffect, useRef } from 'react';
import {
  ServiceReport,
  VisitNumber,
  ServiceStatus,
  ServiceLocation,
  DamagedComponents,
  AdminProfile,
  UserRole,
  FolioConfig,
  EquipmentTypeConfig,
  ServiceTaskType,
} from '../types';
import { SignaturePad, SignaturePadRef } from './SignaturePad';
import {
  X,
  Upload,
  Check,
  Printer,
  Camera,
  Trash2,
  Loader2,
  MapPin,
  Building,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  Calendar,
  Lock,
  UserCheck,
  Wrench,
  CheckSquare,
  Square,
  Sparkles,
  ListChecks,
  HelpCircle,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';
import { getNextFolioPreview } from '../utils/folioManager';
import { loadEquipmentTypes } from '../utils/equipmentTypesManager';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: ServiceReport, andDownloadPDF?: boolean) => void;
  initialReport?: ServiceReport | null;
  existingReportsCount: number;
  defaultAdminProfile?: AdminProfile;
  currentRole?: UserRole;
  currentUserName?: string;
  techniciansList?: string[];
  folioConfig?: FolioConfig;
  equipmentTypes?: EquipmentTypeConfig[];
}

const SERVICE_TASK_OPTIONS: ServiceTaskType[] = [
  'Diagnóstico',
  'Mantenimiento',
  'Reparación',
];

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReport,
  existingReportsCount,
  defaultAdminProfile,
  currentRole = 'admin',
  currentUserName = '',
  techniciansList = [],
  folioConfig,
  equipmentTypes: propEquipmentTypes,
}) => {
  // Use passed equipment types or load cached
  const availableEquipmentTypes: EquipmentTypeConfig[] =
    propEquipmentTypes && propEquipmentTypes.length > 0
      ? propEquipmentTypes
      : loadEquipmentTypes();

  // File & Camera input refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Dedicated refs for "Foto Antes" and "Foto Después"
  const fotoAntesFileRef = useRef<HTMLInputElement | null>(null);
  const fotoAntesCamRef = useRef<HTMLInputElement | null>(null);
  const fotoDespuesFileRef = useRef<HTMLInputElement | null>(null);
  const fotoDespuesCamRef = useRef<HTMLInputElement | null>(null);

  const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getNextFolioData = () => {
    return getNextFolioPreview(folioConfig);
  };

  // 1. Top Section: Folios & Status
  const [folio, setFolio] = useState('');
  const [reportCode, setReportCode] = useState('SOT-REP-CLG-01');
  const [status, setStatus] = useState<ServiceStatus>('En Revisión');
  const [fechaAgenda, setFechaAgenda] = useState<string>('');
  const [fecha, setFecha] = useState(getTodayString());
  const [tipoServicio, setTipoServicio] = useState<ServiceLocation>('campo');

  // 2. Client & Visit Section
  const [empresa, setEmpresa] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [numVisita, setNumVisita] = useState<VisitNumber>(1);
  const [serviciosRealizar, setServiciosRealizar] = useState<ServiceTaskType[]>([
    'Diagnóstico',
  ]);
  const [tipoEquipoNombre, setTipoEquipoNombre] = useState('');
  const [tecnicoNombre, setTecnicoNombre] = useState('');

  // 3. Equipment & Checklist
  const [selectedEquipmentTypeId, setSelectedEquipmentTypeId] = useState<string>('');
  const [equipo, setEquipo] = useState('Impresora Térmica');
  const [marca, setMarca] = useState('Zebra');
  const [modelo, setModelo] = useState('ZT411');
  const [dpi, setDpi] = useState('203');
  const [noSerie, setNoSerie] = useState('');

  // Standard thermal damages checklist (for backwards compatibility & printout)
  const [danos, setDanos] = useState<DamagedComponents>({
    cabezal: false,
    rodilloPrincipal: false,
    display: false,
    sensorPapel: false,
    sensorRibbon: false,
    bandas: false,
    cutter: false,
    rebobinador: false,
    otro: false,
  });

  // Dynamic checklist results per equipment type
  const [danosDinamicos, setDanosDinamicos] = useState<Record<string, boolean>>({});
  const [descripcionDanos, setDescripcionDanos] = useState('');

  // Photographic Evidences: Antes, Después, Prueba de Cabezal, Galería
  const [fotoAntes, setFotoAntes] = useState<string | undefined>(undefined);
  const [fotoDespues, setFotoDespues] = useState<string | undefined>(undefined);
  const [pruebaCabezalImagen, setPruebaCabezalImagen] = useState<string | undefined>(undefined);
  const [pruebaCabezalResultado, setPruebaCabezalResultado] = useState(
    'Prueba de impresión satisfactoria. Cabezal 100% operativo sin líneas blancas.'
  );
  const [evidenciasFotos, setEvidenciasFotos] = useState<string[]>([]);

  // Loading states for image optimizations
  const [isCompressingAntes, setIsCompressingAntes] = useState(false);
  const [isCompressingDespues, setIsCompressingDespues] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isCompressingEvidence, setIsCompressingEvidence] = useState(false);

  // Signatures
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteFirma, setClienteFirma] = useState<string | undefined>(undefined);
  const [tecnicoFirma, setTecnicoFirma] = useState<string | undefined>(undefined);
  const [observacionesGenerales, setObservacionesGenerales] = useState('');

  const clientSigPadRef = useRef<SignaturePadRef | null>(null);
  const techSigPadRef = useRef<SignaturePadRef | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync state on modal open or report change
  useEffect(() => {
    if (initialReport) {
      setFolio(initialReport.folio);
      setReportCode(initialReport.reportCode || 'SOT-REP-CLG-01');
      setStatus(initialReport.status || 'En Revisión');
      setFechaAgenda(initialReport.fechaAgenda || '');
      setFecha(initialReport.fecha);
      setTipoServicio(initialReport.tipoServicio || 'campo');

      setEmpresa(initialReport.empresa);
      setContactoNombre(initialReport.contactoNombre || '');
      setClienteEmail(initialReport.clienteEmail || '');
      setTelefono(initialReport.telefono);
      setDireccion(initialReport.direccion);
      setNumVisita(initialReport.numVisita);
      setServiciosRealizar(
        initialReport.serviciosRealizar && initialReport.serviciosRealizar.length > 0
          ? initialReport.serviciosRealizar
          : ['Diagnóstico']
      );
      setTipoEquipoNombre(
        initialReport.tipoEquipoNombre || initialReport.equipo?.equipo || ''
      );

      setEquipo(initialReport.equipo?.equipo || 'Impresora Térmica');
      setMarca(initialReport.equipo?.marca || 'Zebra');
      setModelo(initialReport.equipo?.modelo || 'ZT411');
      setDpi(initialReport.equipo?.dpi || '203');
      setNoSerie(initialReport.equipo?.noSerie || '');

      setDanos(initialReport.danos || {
        cabezal: false,
        rodilloPrincipal: false,
        display: false,
        sensorPapel: false,
        sensorRibbon: false,
        bandas: false,
        cutter: false,
        rebobinador: false,
        otro: false,
      });

      setDanosDinamicos(initialReport.danosDinamicos || {});
      setDescripcionDanos(initialReport.descripcionDanos || '');

      setFotoAntes(initialReport.fotoAntes);
      setFotoDespues(initialReport.fotoDespues);
      setPruebaCabezalImagen(initialReport.pruebaCabezalImagen);
      setPruebaCabezalResultado(initialReport.pruebaCabezalResultado || '');
      setEvidenciasFotos(initialReport.evidenciasFotos || []);

      setClienteNombre(initialReport.clienteNombre || '');
      setClienteFirma(initialReport.clienteFirma);
      setTecnicoNombre(initialReport.tecnicoNombre || '');
      setTecnicoFirma(initialReport.tecnicoFirma);
      setObservacionesGenerales(initialReport.observacionesGenerales || '');

      // Match equipment type
      const matched = availableEquipmentTypes.find(
        (t) =>
          t.nombre.toLowerCase().includes(initialReport.equipo?.equipo?.toLowerCase() || '') ||
          t.nombre.toLowerCase().includes(initialReport.tipoEquipoNombre?.toLowerCase() || '')
      );
      if (matched) {
        setSelectedEquipmentTypeId(matched.id);
      } else if (availableEquipmentTypes.length > 0) {
        setSelectedEquipmentTypeId(availableEquipmentTypes[0].id);
      }
    } else {
      // New Report defaults
      const nextData = getNextFolioData();
      setFolio(nextData.folio);
      setReportCode(nextData.reportCode);
      setStatus('En Revisión');
      setFechaAgenda('');
      setFecha(getTodayString());
      setTipoServicio('campo');

      setEmpresa('');
      setContactoNombre('');
      setClienteEmail('');
      setTelefono('');
      setDireccion('');
      setNumVisita(1);
      setServiciosRealizar(['Diagnóstico']);
      setTipoEquipoNombre('Impresora de Etiquetas');

      setEquipo('Impresora Térmica');
      setMarca('Zebra');
      setModelo('ZT411');
      setDpi('203');
      setNoSerie('');

      setDanos({
        cabezal: false,
        rodilloPrincipal: false,
        display: false,
        sensorPapel: false,
        sensorRibbon: false,
        bandas: false,
        cutter: false,
        rebobinador: false,
        otro: false,
      });
      setDanosDinamicos({});
      setDescripcionDanos('');

      setFotoAntes(undefined);
      setFotoDespues(undefined);
      setPruebaCabezalImagen(undefined);
      setPruebaCabezalResultado(
        'Prueba de impresión satisfactoria. Cabezal 100% operativo sin líneas blancas.'
      );
      setEvidenciasFotos([]);

      setClienteNombre('');
      setClienteFirma(undefined);

      // Pre-fill technician
      if (currentRole === 'tecnico') {
        setTecnicoNombre(currentUserName || defaultAdminProfile?.nombre || 'Tec. Carlos Mendoza');
      } else {
        setTecnicoNombre(
          techniciansList[0] || defaultAdminProfile?.nombre || 'Tec. Carlos Mendoza'
        );
      }
      setTecnicoFirma(defaultAdminProfile?.firmaDigital || undefined);
      setObservacionesGenerales('');

      if (availableEquipmentTypes.length > 0) {
        setSelectedEquipmentTypeId(availableEquipmentTypes[0].id);
      }
    }

    setErrors({});
  }, [
    initialReport,
    isOpen,
    existingReportsCount,
    defaultAdminProfile,
    currentRole,
    currentUserName,
    folioConfig,
  ]);

  // When status switches to 'Agendado', ensure fechaAgenda has a default tomorrow date if empty
  const handleStatusChange = (newStatus: ServiceStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Agendado' && !fechaAgenda) {
      setFechaAgenda(getTomorrowString());
    }
  };

  // Toggle service task (Diagnóstico, Mantenimiento, Reparación)
  const toggleServicioTask = (task: ServiceTaskType) => {
    setServiciosRealizar((prev) => {
      if (prev.includes(task)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((t) => t !== task);
      } else {
        return [...prev, task];
      }
    });
  };

  // When changing equipment type from dropdown, update checklist & default name
  const handleEquipmentTypeChange = (typeId: string) => {
    setSelectedEquipmentTypeId(typeId);
    const found = availableEquipmentTypes.find((t) => t.id === typeId);
    if (found) {
      setTipoEquipoNombre(found.nombre);
      setEquipo(found.nombre);
      // Initialize dynamic checklist items if not already set
      setDanosDinamicos((prev) => {
        const next: Record<string, boolean> = { ...prev };
        found.checklists.forEach((item) => {
          if (next[item] === undefined) {
            next[item] = false;
          }
        });
        return next;
      });
    }
  };

  // Toggle dynamic checklist item
  const toggleDynamicChecklist = (itemText: string) => {
    setDanosDinamicos((prev) => ({
      ...prev,
      [itemText]: !prev[itemText],
    }));

    // If it's a thermal printer, keep the standard boolean flags synced too
    const lower = itemText.toLowerCase();
    if (lower.includes('cabezal')) toggleDano('cabezal');
    else if (lower.includes('rodillo')) toggleDano('rodilloPrincipal');
    else if (lower.includes('display')) toggleDano('display');
    else if (lower.includes('sensor de papel')) toggleDano('sensorPapel');
    else if (lower.includes('sensor de ribbon')) toggleDano('sensorRibbon');
    else if (lower.includes('banda')) toggleDano('bandas');
    else if (lower.includes('cutter') || lower.includes('cuchilla')) toggleDano('cutter');
    else if (lower.includes('rebobinador')) toggleDano('rebobinador');
  };

  const toggleDano = (key: keyof DamagedComponents) => {
    setDanos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Image capture / upload helpers
  const handleSinglePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'antes' | 'despues' | 'cabezal'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'antes') setIsCompressingAntes(true);
    if (type === 'despues') setIsCompressingDespues(true);
    if (type === 'cabezal') setIsCompressingImage(true);

    try {
      const compressedDataUrl = await compressImageFile(file, 1000, 1000, 0.76);
      if (type === 'antes') setFotoAntes(compressedDataUrl);
      if (type === 'despues') setFotoDespues(compressedDataUrl);
      if (type === 'cabezal') setPruebaCabezalImagen(compressedDataUrl);
    } catch (err) {
      console.warn(`Error al comprimir foto (${type}):`, err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (type === 'antes') setFotoAntes(res);
        if (type === 'despues') setFotoDespues(res);
        if (type === 'cabezal') setPruebaCabezalImagen(res);
      };
      reader.readAsDataURL(file);
    } finally {
      if (type === 'antes') setIsCompressingAntes(false);
      if (type === 'despues') setIsCompressingDespues(false);
      if (type === 'cabezal') setIsCompressingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Multiple evidence photos
  const handleEvidenceCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsCompressingEvidence(true);
      const processed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const compressed = await compressImageFile(file, 900, 900, 0.72);
          processed.push(compressed);
        } catch {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
          processed.push(base64);
        }
      }
      setEvidenciasFotos((prev) => [...prev, ...processed]);
    } catch (err) {
      console.warn('Error al procesar evidencias:', err);
    } finally {
      setIsCompressingEvidence(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenciasFotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!empresa.trim()) newErrors.empresa = 'El nombre de la empresa es obligatorio.';
    if (!fecha) newErrors.fecha = 'La fecha del servicio es obligatoria.';
    if (status === 'Agendado' && !fechaAgenda) {
      newErrors.fechaAgenda = 'Seleccione la fecha para la cual se está agendando.';
    }
    if (!tecnicoNombre.trim()) {
      newErrors.tecnicoNombre = 'Indique el técnico asignado.';
    }
    if (!descripcionDanos.trim()) {
      newErrors.descripcionDanos = 'Ingrese la descripción o diagnóstico.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (andDownloadPDF = false) => {
    if (!validate()) return;

    const padClientFirma = clientSigPadRef.current?.getSignature();
    const padTechFirma = techSigPadRef.current?.getSignature();

    const finalClientFirma =
      padClientFirma !== undefined ? padClientFirma : clienteFirma;
    const finalTecnicoFirma =
      padTechFirma !== undefined ? padTechFirma : tecnicoFirma;

    const reportData: ServiceReport = {
      id: initialReport?.id || `rep-${Date.now()}`,
      reportCode,
      folio: folio.trim() || getNextFolioData().folio,
      tipoServicio,
      empresa: empresa.trim(),
      fecha,
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      numVisita,

      // Extended Client and Visit
      contactoNombre: contactoNombre.trim(),
      clienteEmail: clienteEmail.trim(),
      serviciosRealizar,
      tipoEquipoNombre: tipoEquipoNombre.trim() || equipo.trim(),

      // Equipment Specs
      equipo: {
        equipo: (tipoEquipoNombre.trim() || equipo.trim()),
        marca: marca.trim() || 'SOTEX',
        modelo: modelo.trim() || 'N/D',
        dpi: dpi.trim() || '203',
        noSerie: noSerie.trim() || 'N/D',
      },

      // Checklists
      danos,
      danosDinamicos,
      descripcionDanos: descripcionDanos.trim(),

      // Evidence & Photos
      fotoAntes,
      fotoDespues,
      pruebaCabezalImagen,
      pruebaCabezalResultado: pruebaCabezalResultado.trim(),
      evidenciasFotos,

      // Sign-off
      clienteNombre: clienteNombre.trim() || contactoNombre.trim(),
      clienteFirma: finalClientFirma,
      tecnicoNombre: tecnicoNombre.trim(),
      tecnicoFirma: finalTecnicoFirma,
      tecnicoId: initialReport?.tecnicoId,
      aceptadaPorTecnico: initialReport?.aceptadaPorTecnico ?? false,
      fechaAceptada: initialReport?.fechaAceptada,

      // Status & Scheduling
      status,
      fechaAgenda: status === 'Agendado' ? fechaAgenda : undefined,
      observacionesGenerales: observacionesGenerales.trim(),
      createdAt: initialReport?.createdAt || new Date().toISOString(),
    };

    onSave(reportData, andDownloadPDF);
  };

  if (!isOpen) return null;

  // Active equipment type config
  const activeTypeConfig =
    availableEquipmentTypes.find((t) => t.id === selectedEquipmentTypeId) ||
    availableEquipmentTypes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
        {/* Header Modal Bar */}
        <div className="bg-[#212121] text-white px-5 py-3.5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <img
              src="https://sotex.com.mx/wp-content/uploads/2023/02/cropped-PNG-1-scaled-300x114.png"
              alt="SOTEX"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>
                  {initialReport
                    ? 'Modificar Orden de Trabajo'
                    : 'Nueva Orden de Trabajo / Reporte de Servicio'}
                </span>
                <span className="text-xs font-mono font-normal bg-red-900/80 text-red-300 px-2 py-0.5 rounded border border-red-700">
                  {reportCode}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Formato institucional oficial para servicio técnico y diagnóstico de impresoras y equipos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 text-slate-800">
          {/* ==========================================
              1. SECCIÓN: REGISTRO / ESTATUS
              ========================================== */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D60000]" />
                1. Registro / Estatus y Folio
              </span>
              {currentRole === 'tecnico' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Folios bloqueados para técnicos (Solo lectura)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Folio Consecutivo - Lock for technicians */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Folio Consecutivo</span>
                  {currentRole === 'tecnico' && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      Solo lectura
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={folio}
                    onChange={(e) => currentRole === 'admin' && setFolio(e.target.value)}
                    readOnly={currentRole === 'tecnico'}
                    placeholder="SOT-2026-001"
                    className={`w-full text-xs font-mono font-bold border rounded px-2.5 py-1.5 focus:outline-hidden ${
                      currentRole === 'tecnico'
                        ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-slate-300 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000]'
                    }`}
                  />
                  {currentRole === 'tecnico' && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                  )}
                </div>
              </div>

              {/* Código de Formato - Lock for technicians */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Código de Formato</span>
                  {currentRole === 'tecnico' && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                      Solo lectura
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={reportCode}
                    onChange={(e) => currentRole === 'admin' && setReportCode(e.target.value)}
                    readOnly={currentRole === 'tecnico'}
                    className={`w-full text-xs font-mono border rounded px-2.5 py-1.5 focus:outline-hidden ${
                      currentRole === 'tecnico'
                        ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-slate-300 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000]'
                    }`}
                  />
                  {currentRole === 'tecnico' && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                  )}
                </div>
              </div>

              {/* Estatus dropdown - Includes "Agendado" (Cupo lleno / Programado) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Estatus del Reporte *
                </label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as ServiceStatus)}
                  className={`w-full text-xs font-bold border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden cursor-pointer ${
                    status === 'Agendado'
                      ? 'bg-purple-50 text-purple-900 border-purple-300'
                      : status === 'En Revisión'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  <option value="Agendado">📅 Agendado (Cupo Lleno / Programado)</option>
                  <option value="En Revisión">1. En Revisión</option>
                  <option value="Pendiente Refacción">2. Pendiente Refacción</option>
                  <option value="Garantía">3. Garantía</option>
                  <option value="Completado">4. Completado</option>
                </select>
              </div>

              {/* Fecha del Servicio Actual */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Fecha del Servicio *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={`w-full text-xs bg-white border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden ${
                    errors.fecha ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.fecha && <p className="text-[10px] text-red-600 mt-0.5">{errors.fecha}</p>}
              </div>
            </div>

            {/* Sub-block when status is "Agendado": Fecha de agenda picker */}
            {status === 'Agendado' && (
              <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-900">
                      Servicio en estatus "Agendado" (Cupo lleno)
                    </h4>
                    <p className="text-[11px] text-purple-700">
                      Indica la fecha programada para la cual se agenda la atención o visita de este equipo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs font-bold text-purple-900 whitespace-nowrap">
                    Fecha de Agenda: *
                  </label>
                  <input
                    type="date"
                    value={fechaAgenda}
                    onChange={(e) => setFechaAgenda(e.target.value)}
                    className={`text-xs bg-white border rounded-lg px-3 py-1.5 font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden shadow-2xs ${
                      errors.fechaAgenda ? 'border-red-500 ring-2 ring-red-500' : 'border-purple-300'
                    }`}
                  />
                </div>
              </div>
            )}
            {errors.fechaAgenda && (
              <p className="text-[10px] text-red-600 font-semibold">{errors.fechaAgenda}</p>
            )}
          </div>

          {/* Location of service: 'En campo' vs 'En Sotex' */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lugar del Servicio *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoServicio('campo')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  tipoServicio === 'campo'
                    ? 'border-[#D60000] bg-red-50/60 ring-2 ring-red-500/20 text-[#D60000]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    tipoServicio === 'campo' ? 'bg-[#D60000] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">En Campo (Sitio del Cliente)</span>
                  <span className="text-[11px] text-slate-500 block">
                    Servicio técnico realizado directamente en las instalaciones del cliente
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoServicio('sotex')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                  tipoServicio === 'sotex'
                    ? 'border-[#D60000] bg-red-50/60 ring-2 ring-red-500/20 text-[#D60000]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    tipoServicio === 'sotex' ? 'bg-[#D60000] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">En Sotex (Taller / Laboratorio)</span>
                  <span className="text-[11px] text-slate-500 block">
                    Equipo ingresado al laboratorio de servicio y diagnóstico SOTEX
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ==========================================
              2. SECCIÓN: DATOS DEL CLIENTE Y VISITA
              ========================================== */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              2. Datos del Cliente y Visita
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Empresa / Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Empresa / Razón Social *
                </label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ej. FlexiTech del Bajío S.A. de C.V."
                  className={`w-full text-xs border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden ${
                    errors.empresa ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.empresa && <p className="text-[10px] text-red-600 mt-0.5">{errors.empresa}</p>}
              </div>

              {/* Persona de Contacto (debajo o junto a Empresa) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Persona de Contacto (Coordinación)
                </label>
                <input
                  type="text"
                  value={contactoNombre}
                  onChange={(e) => {
                    setContactoNombre(e.target.value);
                    if (!clienteNombre) setClienteNombre(e.target.value);
                  }}
                  placeholder="Ej. Lic. Fernando Martínez / Ing. de Planta"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              {/* Correo Electrónico del Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico del Cliente
                </label>
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 33 3812 9400"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Las Torres #452, Parque Industrial El Salto, Jal."
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              {/* Asignación de técnico en la parte superior (Sincronizado con bloque de firma) */}
              <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#D60000]" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Asignar Técnico Responsable *
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Selecciona o confirma al técnico desde el registro inicial (sincronizado con bloque de firmas).
                    </span>
                  </div>
                </div>

                <div className="sm:w-72">
                  {currentRole === 'admin' && techniciansList.length > 0 ? (
                    <select
                      value={tecnicoNombre}
                      onChange={(e) => setTecnicoNombre(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden cursor-pointer"
                    >
                      {techniciansList.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={tecnicoNombre}
                      onChange={(e) => setTecnicoNombre(e.target.value)}
                      placeholder="Tec. Carlos Mendoza"
                      className="w-full text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                    />
                  )}
                  {errors.tecnicoNombre && (
                    <p className="text-[10px] text-red-600 mt-0.5">{errors.tecnicoNombre}</p>
                  )}
                </div>
              </div>

              {/* Servicio a realizar (Casillas múltiples) + Nombre/Tipo de equipo rápido a un costado */}
              <div className="md:col-span-2 pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                {/* Casillas múltiples de servicio a realizar */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Servicio a Realizar (Selección Múltiple)
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {SERVICE_TASK_OPTIONS.map((task) => {
                      const isSelected = serviciosRealizar.includes(task);
                      return (
                        <button
                          key={task}
                          type="button"
                          onClick={() => toggleServicioTask(task)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{task}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campo de texto abierto a un costado para capturar rápidamente el Nombre/Tipo de equipo */}
                <div className="md:col-span-6 space-y-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Nombre / Tipo de Equipo</span>
                    <span className="text-[10px] text-slate-400 font-normal">Captura rápida</span>
                  </label>
                  <input
                    type="text"
                    list="equipos-sugeridos"
                    value={tipoEquipoNombre}
                    onChange={(e) => {
                      setTipoEquipoNombre(e.target.value);
                      setEquipo(e.target.value);
                    }}
                    placeholder="ej. Impresora de etiquetas, Escáner, Terminal, etc."
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                  />
                  <datalist id="equipos-sugeridos">
                    {availableEquipmentTypes.map((eq) => (
                      <option key={eq.id} value={eq.nombre} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Num. de visita */}
              <div className="md:col-span-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Número de visita:
                </label>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4] as VisitNumber[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNumVisita(v)}
                      className={`flex-1 sm:flex-initial sm:w-24 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        numVisita === v
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>Visita {v}</span>
                      {numVisita === v && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              3. SECCIÓN: DATOS DEL EQUIPO Y REVISIÓN
              ========================================== */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                3. Datos del Equipo en Revisión
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipo *</label>
                <input
                  type="text"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  placeholder="Impresora Térmica"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marca *</label>
                <input
                  type="text"
                  list="marcas-list"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Zebra / SATO / etc."
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
                <datalist id="marcas-list">
                  <option value="Zebra" />
                  <option value="SATO" />
                  <option value="Honeywell" />
                  <option value="Datamax" />
                  <option value="TSC" />
                  <option value="Intermec" />
                  <option value="Bixolon" />
                  <option value="HP" />
                  <option value="Brother" />
                  <option value="Epson" />
                  <option value="Canon" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo *</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ej. ZT411, CL4NX"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">DPI</label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                >
                  <option value="203">203 DPI</option>
                  <option value="300">300 DPI</option>
                  <option value="600">600 DPI</option>
                  <option value="N/A">N/A (Cómputo/Escáner)</option>
                  <option value="Otro">Otro DPI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. de serie
                </label>
                <input
                  type="text"
                  value={noSerie}
                  onChange={(e) => setNoSerie(e.target.value)}
                  placeholder="42J19420018"
                  className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* ==========================================
              4. MÓDULO DINÁMICO DE EQUIPOS Y CHECKLISTS
              ========================================== */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="bg-neutral-900 text-white px-3 py-2 rounded-t-lg -mx-4 -mt-4 mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Checklist Dinámico de Fallas / Daños Comunes
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-normal">
                Selecciona la categoría para cargar automáticamente las revisiones
              </span>
            </div>

            {/* Equipment Category Selector for dynamic checklist */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Tipo de Equipo Configurado:
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Carga dinámicamente la lista de fallas correspondiente desde el módulo de administración.
                </span>
              </div>

              <select
                value={selectedEquipmentTypeId}
                onChange={(e) => handleEquipmentTypeChange(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden cursor-pointer sm:w-64"
              >
                {availableEquipmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Checklist Checkboxes */}
            {activeTypeConfig && activeTypeConfig.checklists.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Checklist específico para {activeTypeConfig.nombre}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeTypeConfig.checklists.map((checkItem) => {
                    const isChecked = Boolean(danosDinamicos[checkItem]);
                    return (
                      <label
                        key={checkItem}
                        onClick={() => toggleDynamicChecklist(checkItem)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none text-left ${
                          isChecked
                            ? 'bg-red-50 border-red-300 text-red-900 font-semibold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs pr-2">{checkItem}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Controlled by label click
                          className="w-4 h-4 text-red-600 rounded border-slate-300 cursor-pointer shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description textarea */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Detalle Diagnóstico, Causas, Desgastes o Refacciones Requeridas *
              </label>
              <textarea
                rows={3}
                value={descripcionDanos}
                onChange={(e) => setDescripcionDanos(e.target.value)}
                placeholder="Ej. Diagnóstico: rodillo principal desgastado con acumulación de adhesivo. Se realiza mantenimiento y ajuste de presión..."
                className={`w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden ${
                  errors.descripcionDanos ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                }`}
              />
              {errors.descripcionDanos && (
                <p className="text-[10px] text-red-600 mt-0.5">{errors.descripcionDanos}</p>
              )}
            </div>
          </div>

          {/* ==========================================
              3. EVIDENCIAS FOTOGRÁFICAS (ANTES, DESPUÉS, CABEZAL Y GALERÍA)
              ========================================== */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D60000]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Evidencia Fotográfica: Foto "Antes", "Después" y Prueba de Cabezal
                </h3>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Captura directamente con la cámara del celular o sube fotos para documentar el estado en el que se recibe el equipo ("Antes") y el resultado final entregado ("Después").
            </p>

            {/* Hidden Inputs for Foto Antes & Foto Despues */}
            <input
              ref={fotoAntesCamRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleSinglePhotoUpload(e, 'antes')}
              className="hidden"
            />
            <input
              ref={fotoAntesFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleSinglePhotoUpload(e, 'antes')}
              className="hidden"
            />

            <input
              ref={fotoDespuesCamRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleSinglePhotoUpload(e, 'despues')}
              className="hidden"
            />
            <input
              ref={fotoDespuesFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleSinglePhotoUpload(e, 'despues')}
              className="hidden"
            />

            {/* Two Side-by-side Photo Cards: Foto "Antes" and Foto "Después" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Foto "Antes" */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded">
                      Foto "Antes" (Estado Inicial)
                    </span>
                    {fotoAntes && (
                      <button
                        type="button"
                        onClick={() => setFotoAntes(undefined)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Evidencia del estado físico o fallas con las que el técnico recibe el equipo.
                  </p>
                </div>

                {/* Preview Area */}
                <div className="aspect-video w-full rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden mb-3">
                  {fotoAntes ? (
                    <img
                      src={fotoAntes}
                      alt="Foto Antes"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Camera className="w-6 h-6 mx-auto opacity-40 mb-1" />
                      <span className="text-[11px]">Sin fotografía "Antes"</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCompressingAntes}
                    onClick={() => fotoAntesCamRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isCompressingAntes ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Cámara</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCompressingAntes}
                    onClick={() => fotoAntesFileRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Subir</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Foto "Después" */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded">
                      Foto "Después" (Servicio Realizado)
                    </span>
                    {fotoDespues && (
                      <button
                        type="button"
                        onClick={() => setFotoDespues(undefined)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Evidencia posterior al servicio, limpieza o reparación del equipo.
                  </p>
                </div>

                {/* Preview Area */}
                <div className="aspect-video w-full rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden mb-3">
                  {fotoDespues ? (
                    <img
                      src={fotoDespues}
                      alt="Foto Después"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Camera className="w-6 h-6 mx-auto opacity-40 mb-1" />
                      <span className="text-[11px]">Sin fotografía "Después"</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isCompressingDespues}
                    onClick={() => fotoDespuesCamRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isCompressingDespues ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Cámara</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCompressingDespues}
                    onClick={() => fotoDespuesFileRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Subir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prueba de Cabezal Térmico / Calidad */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-[#D60000]" />
                  Prueba de Impresión del Cabezal Térmico / Calidad
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnóstico y Resultado de la Prueba
                  </label>
                  <textarea
                    rows={2}
                    value={pruebaCabezalResultado}
                    onChange={(e) => setPruebaCabezalResultado(e.target.value)}
                    placeholder="Cabezal 100% operativo sin puntos muertos..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                  />

                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSinglePhotoUpload(e, 'cabezal')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isCompressingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isCompressingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D60000]" />
                          Optimizando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Adjuntar Muestra de Impresión
                        </>
                      )}
                    </button>
                    {pruebaCabezalImagen && (
                      <button
                        type="button"
                        onClick={() => setPruebaCabezalImagen(undefined)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="border border-dashed border-slate-300 bg-white rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] text-center">
                  {pruebaCabezalImagen ? (
                    <div className="relative w-full h-full max-h-36 flex items-center justify-center overflow-hidden">
                      <img
                        src={pruebaCabezalImagen}
                        alt="Prueba de impresión"
                        className="object-contain max-h-32 rounded border border-slate-300 shadow-xs"
                      />
                    </div>
                  ) : (
                    <div className="text-slate-400 space-y-1">
                      <Printer className="w-6 h-6 mx-auto opacity-40" />
                      <p className="text-[11px] font-medium text-slate-600">
                        Área de comprobante de cabezal térmico
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Fotografía de etiqueta de prueba o patrón técnico generado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Photographic Evidence Gallery */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Galería de Evidencias Adicionales ({evidenciasFotos.length})
                </span>
                <div className="flex items-center gap-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEvidenceCapture}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isCompressingEvidence}
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Fotos</span>
                  </button>
                </div>
              </div>

              {evidenciasFotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                  {evidenciasFotos.map((foto, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square flex items-center justify-center shadow-2xs"
                    >
                      <img
                        src={foto}
                        alt={`Evidencia ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(idx)}
                          className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ==========================================
              5. SECCIÓN: FIRMAS DE CONFORMIDAD Y SOPORTE
              ========================================== */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Firmas de Conformidad y Recepción
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cliente */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  Nombre, firma, correo (Cliente)
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Nombre del Cliente / Representante
                  </label>
                  <input
                    type="text"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    placeholder="Lic. Roberto Valenzuela"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    placeholder="cliente@empresa.com"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                  />
                </div>
                <SignaturePad
                  ref={clientSigPadRef}
                  label="Firma del Cliente"
                  initialSignature={clienteFirma}
                  onSave={(dataUrl) => setClienteFirma(dataUrl)}
                  onClear={() => setClienteFirma(undefined)}
                />
              </div>

              {/* Ingeniero / Técnico SOTEX */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  Técnico Asignado y Firma (Ing. SOTEX) *
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Nombre del Técnico / Ingeniero (Sincronizado) *
                  </label>
                  {currentRole === 'admin' && techniciansList.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={tecnicoNombre}
                        onChange={(e) => setTecnicoNombre(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden cursor-pointer font-medium"
                      >
                        {techniciansList.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500">
                        El técnico asignado recibirá notificación inmediata de esta orden.
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={tecnicoNombre}
                      onChange={(e) => setTecnicoNombre(e.target.value)}
                      placeholder="Tec. Carlos Mendoza"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden font-medium"
                    />
                  )}
                  {errors.tecnicoNombre && (
                    <p className="text-[10px] text-red-600 mt-0.5">{errors.tecnicoNombre}</p>
                  )}
                </div>

                {/* SOTEX Contact info - Corrected to soporte.gdl@sotex.com.mx */}
                <div className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                  <p>
                    <strong>Contacto SOTEX:</strong> soporte.gdl@sotex.com.mx
                  </p>
                  <p>
                    <strong>Portal Oficial:</strong> www.sotex.com.mx
                  </p>
                </div>

                <SignaturePad
                  ref={techSigPadRef}
                  label="Firma del Ingeniero SOTEX"
                  initialSignature={tecnicoFirma}
                  onSave={(dataUrl) => setTecnicoFirma(dataUrl)}
                  onClear={() => setTecnicoFirma(undefined)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Guardar Orden
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#D60000] hover:bg-[#b50000] rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Guardar y Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
