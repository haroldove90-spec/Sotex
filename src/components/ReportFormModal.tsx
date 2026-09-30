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
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';
import { getNextFolioPreview } from '../utils/folioManager';

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
}

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
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getNextFolioData = () => {
    const preview = getNextFolioPreview(folioConfig);
    return preview;
  };

  // State
  const [folio, setFolio] = useState('');
  const [reportCode, setReportCode] = useState('SOT-REP-CLG-01');
  const [tipoServicio, setTipoServicio] = useState<ServiceLocation>('campo');
  const [empresa, setEmpresa] = useState('');
  const [fecha, setFecha] = useState(getTodayString());
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numVisita, setNumVisita] = useState<VisitNumber>(1);

  // Equipment
  const [equipo, setEquipo] = useState('Impresora Térmica');
  const [marca, setMarca] = useState('Zebra');
  const [modelo, setModelo] = useState('ZT411');
  const [dpi, setDpi] = useState('203');
  const [noSerie, setNoSerie] = useState('');

  // Damages checklist
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

  const [descripcionDanos, setDescripcionDanos] = useState('');

  // Printhead test
  const [pruebaCabezalResultado, setPruebaCabezalResultado] = useState(
    'Prueba de impresión satisfactoria. Cabezal 100% operativo sin líneas blancas.'
  );
  const [pruebaCabezalImagen, setPruebaCabezalImagen] = useState<string | undefined>(undefined);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Photographic Evidence (Mobile camera or gallery)
  const [evidenciasFotos, setEvidenciasFotos] = useState<string[]>([]);
  const [isCompressingEvidence, setIsCompressingEvidence] = useState(false);

  // Client
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteFirma, setClienteFirma] = useState<string | undefined>(undefined);
  const clientSigPadRef = useRef<SignaturePadRef | null>(null);

  // Engineer / Technician
  const [tecnicoNombre, setTecnicoNombre] = useState('');
  const [tecnicoFirma, setTecnicoFirma] = useState<string | undefined>(undefined);
  const techSigPadRef = useRef<SignaturePadRef | null>(null);

  // Status (Default: 'En Revisión' as first priority)
  const [status, setStatus] = useState<ServiceStatus>('En Revisión');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialReport) {
      setFolio(initialReport.folio);
      setReportCode(initialReport.reportCode || 'SOT-REP-CLG-01');
      setTipoServicio(initialReport.tipoServicio || 'campo');
      setEmpresa(initialReport.empresa);
      setFecha(initialReport.fecha);
      setDireccion(initialReport.direccion);
      setTelefono(initialReport.telefono);
      setNumVisita(initialReport.numVisita);

      setEquipo(initialReport.equipo.equipo);
      setMarca(initialReport.equipo.marca);
      setModelo(initialReport.equipo.modelo);
      setDpi(initialReport.equipo.dpi);
      setNoSerie(initialReport.equipo.noSerie);

      setDanos(initialReport.danos);
      setDescripcionDanos(initialReport.descripcionDanos);

      setPruebaCabezalResultado(initialReport.pruebaCabezalResultado || '');
      setPruebaCabezalImagen(initialReport.pruebaCabezalImagen);
      setEvidenciasFotos(initialReport.evidenciasFotos || []);

      setClienteNombre(initialReport.clienteNombre);
      setClienteEmail(initialReport.clienteEmail);
      setClienteFirma(initialReport.clienteFirma);

      setTecnicoNombre(initialReport.tecnicoNombre);
      setTecnicoFirma(initialReport.tecnicoFirma);

      setStatus(initialReport.status || 'En Revisión');
      setObservacionesGenerales(initialReport.observacionesGenerales || '');
    } else {
      // Reset to defaults for a new report
      const nextData = getNextFolioData();
      setFolio(nextData.folio);
      setReportCode(nextData.reportCode);
      setTipoServicio('campo');
      setEmpresa('');
      setFecha(getTodayString());
      setDireccion('');
      setTelefono('');
      setNumVisita(1);
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
      setDescripcionDanos('');
      setPruebaCabezalResultado(
        'Prueba de impresión satisfactoria. Cabezal 100% operativo sin líneas blancas.'
      );
      setPruebaCabezalImagen(undefined);
      setEvidenciasFotos([]);
      setClienteNombre('');
      setClienteEmail('');
      setClienteFirma(undefined);

      // Pre-fill technician name: if current user is technician, assign to self automatically!
      if (currentRole === 'tecnico') {
        setTecnicoNombre(currentUserName || defaultAdminProfile?.nombre || 'Tec. Carlos Mendoza');
      } else {
        setTecnicoNombre(
          techniciansList[0] || defaultAdminProfile?.nombre || 'Tec. Carlos Mendoza'
        );
      }

      setTecnicoFirma(defaultAdminProfile?.firmaDigital || undefined);
      // "En Revisión" is in first place and default
      setStatus('En Revisión');
      setObservacionesGenerales('');
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

  if (!isOpen) return null;

  const toggleDano = (key: keyof DamagedComponents) => {
    setDanos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Upload/compress printhead sample
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImage(true);
      const compressedDataUrl = await compressImageFile(file, 1000, 1000, 0.75);
      setPruebaCabezalImagen(compressedDataUrl);
    } catch (err) {
      console.warn('Error al optimizar imagen, usando método directo:', err);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setPruebaCabezalImagen(result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload/compress evidence photos from camera or gallery
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
          // Fallback reading
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
      console.warn('Error al procesar evidencias fotográficas:', err);
    } finally {
      setIsCompressingEvidence(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenciasFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!empresa.trim()) newErrors.empresa = 'El nombre de la empresa es obligatorio.';
    if (!fecha) newErrors.fecha = 'La fecha es obligatoria.';
    if (!equipo.trim()) newErrors.equipo = 'Especificar equipo.';
    if (!marca.trim()) newErrors.marca = 'Especificar marca.';
    if (!modelo.trim()) newErrors.modelo = 'Especificar modelo.';
    if (!noSerie.trim()) newErrors.noSerie = 'Indicar el número de serie.';
    if (!descripcionDanos.trim()) newErrors.descripcionDanos = 'Ingrese la descripción o diagnóstico.';
    if (!tecnicoNombre.trim()) newErrors.tecnicoNombre = 'Indique el técnico asignado.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (andDownloadPDF = false) => {
    if (!validate()) {
      return;
    }

    // Read latest canvas signature data from pad refs if available, fallback to state
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
      equipo: {
        equipo: equipo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        dpi: dpi.trim(),
        noSerie: noSerie.trim(),
      },
      danos,
      descripcionDanos: descripcionDanos.trim(),
      pruebaCabezalResultado: pruebaCabezalResultado.trim(),
      pruebaCabezalImagen,
      evidenciasFotos,
      clienteNombre: clienteNombre.trim(),
      clienteEmail: clienteEmail.trim(),
      clienteFirma: finalClientFirma,
      tecnicoNombre: tecnicoNombre.trim(),
      tecnicoFirma: finalTecnicoFirma,
      aceptadaPorTecnico: initialReport?.aceptadaPorTecnico ?? false,
      fechaAceptada: initialReport?.fechaAceptada,
      status,
      observacionesGenerales: observacionesGenerales.trim(),
      createdAt: initialReport?.createdAt || new Date().toISOString(),
    };

    onSave(reportData, andDownloadPDF);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
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
                Formato institucional oficial para servicio técnico y diagnóstico de impresoras
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
          {/* Top Info Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Folio Consecutivo
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="SOT-2026-001"
                className="w-full text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Código de Formato
              </label>
              <input
                type="text"
                value={reportCode}
                onChange={(e) => setReportCode(e.target.value)}
                className="w-full text-xs font-mono bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
              />
            </div>

            {/* Estatus dropdown - EN REVISIÓN IS FIRST AND DEFAULT */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Estado del Reporte *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden text-slate-800 cursor-pointer"
              >
                <option value="En Revisión">1. En Revisión</option>
                <option value="Pendiente Refacción">2. Pendiente Refacción</option>
                <option value="Garantía">3. Garantía</option>
                <option value="Completado">4. Completado</option>
              </select>
            </div>

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

          {/* Section: General Info (Empresa, Dirección, Tel, Num de visita) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Datos del Cliente y Visita
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Empresa / Cliente *
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

              {/* Num. de visita */}
              <div className="md:col-span-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Num. de visita:
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

          {/* Section: Equipment Table */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Datos del Equipo en Revisión
            </h3>

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
                  <option value="Otro">Otro DPI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. de serie *
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

          {/* Section: Daños detectados durante revisión */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-t-lg -mx-4 -mt-4 mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Daños detectados durante revisión
              </span>
              <span className="text-[10px] text-slate-300 font-normal">
                Marque las casillas con anomalías
              </span>
            </div>

            {/* 3x3 Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Cabezal</span>
                  <input
                    type="checkbox"
                    checked={danos.cabezal}
                    onChange={() => toggleDano('cabezal')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Rodillo principal</span>
                  <input
                    type="checkbox"
                    checked={danos.rodilloPrincipal}
                    onChange={() => toggleDano('rodilloPrincipal')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Display</span>
                  <input
                    type="checkbox"
                    checked={danos.display}
                    onChange={() => toggleDano('display')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Sensor de papel</span>
                  <input
                    type="checkbox"
                    checked={danos.sensorPapel}
                    onChange={() => toggleDano('sensorPapel')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Sensor de ribbon</span>
                  <input
                    type="checkbox"
                    checked={danos.sensorRibbon}
                    onChange={() => toggleDano('sensorRibbon')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Bandas</span>
                  <input
                    type="checkbox"
                    checked={danos.bandas}
                    onChange={() => toggleDano('bandas')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Cutter</span>
                  <input
                    type="checkbox"
                    checked={danos.cutter}
                    onChange={() => toggleDano('cutter')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Rebobinador</span>
                  <input
                    type="checkbox"
                    checked={danos.rebobinador}
                    onChange={() => toggleDano('rebobinador')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Otro</span>
                  <input
                    type="checkbox"
                    checked={danos.otro}
                    onChange={() => toggleDano('otro')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Describa: (Detalle diagnóstico, causas, desgastes o refacciones) *
              </label>
              <textarea
                rows={3}
                value={descripcionDanos}
                onChange={(e) => setDescripcionDanos(e.target.value)}
                placeholder="Ej. Diagnóstico: rodillo principal desgastado con acumulación de adhesivo. Se realiza limpieza profunda..."
                className={`w-full text-xs p-2.5 border rounded-lg focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden ${
                  errors.descripcionDanos ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                }`}
              />
              {errors.descripcionDanos && (
                <p className="text-[10px] text-red-600 mt-0.5">{errors.descripcionDanos}</p>
              )}
            </div>
          </div>

          {/* Section: Multiple Photographic Evidences from Mobile Camera & Files */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D60000]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Evidencias Fotográficas (Cámara Móvil / Galería)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {evidenciasFotos.length} foto{evidenciasFotos.length === 1 ? '' : 's'} adjunta{evidenciasFotos.length === 1 ? '' : 's'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Toma fotografías en tiempo real con la cámara de tu celular o sube fotos desde la galería como respaldo técnico del estado del equipo.
            </p>

            {/* Hidden Inputs for Camera and File Upload */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleEvidenceCapture}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleEvidenceCapture}
              className="hidden"
            />

            {/* Camera & Upload Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isCompressingEvidence}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs transition-transform active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isCompressingEvidence ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Camera className="w-4 h-4 text-emerald-400" />
                )}
                <span>Tomar Foto con Cámara</span>
              </button>

              <button
                type="button"
                disabled={isCompressingEvidence}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>Subir Fotos de Evidencia</span>
              </button>
            </div>

            {/* Photos Preview Gallery */}
            {evidenciasFotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {evidenciasFotos.map((foto, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square flex items-center justify-center shadow-xs"
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
                        title="Eliminar foto"
                        className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer transition-transform hover:scale-110"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Prueba de impresión del cabezal */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="bg-neutral-900 text-white px-3 py-1.5 rounded-t-lg -mx-4 -mt-4 mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                Prueba de impresión del cabezal térmico
              </span>
              <span className="text-[10px] text-slate-300 font-normal">
                Verificación de puntos térmicos y calidad
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
                    onChange={handleImageUpload}
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
              <div className="border border-dashed border-slate-300 bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] text-center">
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

          {/* Section: Signatures & Contact Info */}
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
                    Nombre del Técnico / Ingeniero *
                  </label>
                  {currentRole === 'admin' && techniciansList.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={tecnicoNombre}
                        onChange={(e) => setTecnicoNombre(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden cursor-pointer"
                      >
                        {techniciansList.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-500">
                        El técnico recibirá notificación flotante con sonido de alerta.
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

                <div className="text-[11px] text-slate-500 bg-slate-100 p-2 rounded-lg border border-slate-200">
                  <p>
                    <strong>Contacto SOTEX:</strong> soporteqdl@sotex.com.mx
                  </p>
                  <p>
                    <strong>Portal:</strong> www.sotex.com.mx
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
