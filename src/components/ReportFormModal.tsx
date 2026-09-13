import React, { useState, useEffect, useRef } from 'react';
import { ServiceReport, VisitNumber, ServiceStatus, DamagedComponents, AdminProfile } from '../types';
import { SignaturePad } from './SignaturePad';
import { X, Upload, Check, Printer, Camera, Trash2 } from 'lucide-react';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: ServiceReport, andDownloadPDF?: boolean) => void;
  initialReport?: ServiceReport | null;
  existingReportsCount: number;
  defaultAdminProfile?: AdminProfile;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReport,
  existingReportsCount,
  defaultAdminProfile,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const generateDefaultFolio = () => {
    const year = new Date().getFullYear();
    const count = existingReportsCount + 1;
    return `SOT-${year}-${String(count).padStart(3, '0')}`;
  };

  // State
  const [folio, setFolio] = useState(generateDefaultFolio());
  const [reportCode, setReportCode] = useState('SOT-REP-CLG-01');
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

  // Damages checklist (exactly matches the 9 items from the physical form)
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

  // Client
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteFirma, setClienteFirma] = useState<string | undefined>(undefined);

  // Engineer
  const [tecnicoNombre, setTecnicoNombre] = useState('Ing. Técnico SOTEX');
  const [tecnicoFirma, setTecnicoFirma] = useState<string | undefined>(undefined);

  // Status
  const [status, setStatus] = useState<ServiceStatus>('Completado');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialReport) {
      setFolio(initialReport.folio);
      setReportCode(initialReport.reportCode || 'SOT-REP-CLG-01');
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

      setClienteNombre(initialReport.clienteNombre);
      setClienteEmail(initialReport.clienteEmail);
      setClienteFirma(initialReport.clienteFirma);

      setTecnicoNombre(initialReport.tecnicoNombre);
      setTecnicoFirma(initialReport.tecnicoFirma);

      setStatus(initialReport.status);
      setObservacionesGenerales(initialReport.observacionesGenerales || '');
    } else {
      // Reset to defaults
      setFolio(generateDefaultFolio());
      setReportCode('SOT-REP-CLG-01');
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
      setPruebaCabezalResultado('Prueba de impresión satisfactoria. Cabezal 100% operativo sin líneas blancas.');
      setPruebaCabezalImagen(undefined);
      setClienteNombre('');
      setClienteEmail('');
      setClienteFirma(undefined);
      setTecnicoNombre(defaultAdminProfile?.nombre || 'Ing. Javier Rojas (SOTEX)');
      setTecnicoFirma(defaultAdminProfile?.firmaDigital || undefined);
      setStatus('Completado');
      setObservacionesGenerales('');
    }
    setErrors({});
  }, [initialReport, isOpen, existingReportsCount, defaultAdminProfile]);

  if (!isOpen) return null;

  const toggleDano = (key: keyof DamagedComponents) => {
    setDanos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPruebaCabezalImagen(result);
    };
    reader.readAsDataURL(file);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (andDownloadPDF = false) => {
    if (!validate()) {
      return;
    }

    const reportData: ServiceReport = {
      id: initialReport?.id || `rep-${Date.now()}`,
      reportCode,
      folio: folio.trim() || generateDefaultFolio(),
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
      clienteNombre: clienteNombre.trim(),
      clienteEmail: clienteEmail.trim(),
      clienteFirma,
      tecnicoNombre: tecnicoNombre.trim(),
      tecnicoFirma,
      status,
      observacionesGenerales: observacionesGenerales.trim(),
      createdAt: initialReport?.createdAt || new Date().toISOString(),
    };

    onSave(reportData, andDownloadPDF);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
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
                <span>{initialReport ? 'Modificar Reporte de Servicio' : 'Nuevo Reporte de Servicio Cliente'}</span>
                <span className="text-xs font-mono font-normal bg-red-900/80 text-red-300 px-2 py-0.5 rounded border border-red-700">
                  {reportCode}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Formato físico oficial para soporte en campo de impresoras térmicas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50 text-slate-800">
          {/* Top Info Banner */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Folio Oficial
              </label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="SOT-2024-001"
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Estado del Reporte
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
              >
                <option value="Completado">Completado</option>
                <option value="Pendiente Refacción">Pendiente Refacción</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Garantía">Garantía</option>
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

          {/* Section: General Info (Empresa, Dirección, Tel, Num de visita) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Datos del Cliente y Visita
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Empresa *
                </label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Ej. PTD Logística y Empaque / Cliente"
                  className={`w-full text-xs border rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden ${
                    errors.empresa ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.empresa && <p className="text-[10px] text-red-600 mt-0.5">{errors.empresa}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 33 3812 9400"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. Las Torres #452, Col. El Álamo, Guadalajara, Jal."
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              {/* Num. de visita - Matches physical 4 box layout [1] [2] [3] [4] */}
              <div className="md:col-span-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Num. de visita (Seleccione la casilla correspondiente):
                </label>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4] as VisitNumber[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNumVisita(v)}
                      className={`flex-1 sm:flex-initial sm:w-20 py-1.5 px-3 text-xs font-bold rounded border transition-all flex items-center justify-center gap-1.5 ${
                        numVisita === v
                          ? 'bg-[#212121] text-white border-[#212121] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>Visita {v}</span>
                      {numVisita === v && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Equipment Table (Equipo | Marca | Modelo | DPI | No. de serie) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Datos del Equipo en Revisión
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipo *
                </label>
                <input
                  type="text"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  placeholder="Impresora Térmica"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marca *
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ej. ZT411, CL4NX"
                  className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DPI (Resolución)
                </label>
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

          {/* Section: Daños detectados durante revisión (Exact 3x3 layout) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t -mx-4 -mt-4 mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Daños detectados durante revisión
              </span>
              <span className="text-[10px] text-slate-300 font-normal">
                Marque las casillas con anomalías o desgastes
              </span>
            </div>

            {/* 3 Columns x 3 Rows matching physical sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-md border border-slate-200">
              {/* Columna 1 */}
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Cabezal</span>
                  <input
                    type="checkbox"
                    checked={danos.cabezal}
                    onChange={() => toggleDano('cabezal')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Rodillo principal</span>
                  <input
                    type="checkbox"
                    checked={danos.rodilloPrincipal}
                    onChange={() => toggleDano('rodilloPrincipal')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Display</span>
                  <input
                    type="checkbox"
                    checked={danos.display}
                    onChange={() => toggleDano('display')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>
              </div>

              {/* Columna 2 */}
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Sensor de papel</span>
                  <input
                    type="checkbox"
                    checked={danos.sensorPapel}
                    onChange={() => toggleDano('sensorPapel')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Sensor de ribbon</span>
                  <input
                    type="checkbox"
                    checked={danos.sensorRibbon}
                    onChange={() => toggleDano('sensorRibbon')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Bandas</span>
                  <input
                    type="checkbox"
                    checked={danos.bandas}
                    onChange={() => toggleDano('bandas')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>
              </div>

              {/* Columna 3 */}
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Cutter</span>
                  <input
                    type="checkbox"
                    checked={danos.cutter}
                    onChange={() => toggleDano('cutter')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Rebobinador</span>
                  <input
                    type="checkbox"
                    checked={danos.rebobinador}
                    onChange={() => toggleDano('rebobinador')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer select-none">
                  <span className="text-xs font-medium text-slate-800">Otro</span>
                  <input
                    type="checkbox"
                    checked={danos.otro}
                    onChange={() => toggleDano('otro')}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                </label>
              </div>
            </div>

            {/* Describa: */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Describa: (Detalle el diagnóstico, causas, ajustes o refacciones necesarias) *
              </label>
              <textarea
                rows={3}
                value={descripcionDanos}
                onChange={(e) => setDescripcionDanos(e.target.value)}
                placeholder="Ej. Se realiza mantenimiento preventivo y ajuste en sensor de papel. Limpieza profunda en rodillo y calibración de ribbon..."
                className={`w-full text-xs p-2.5 border rounded-md focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden leading-relaxed bg-[linear-gradient(transparent_27px,#e2e8f0_28px)] bg-[size:100%_28px] ${
                  errors.descripcionDanos ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                }`}
              />
              {errors.descripcionDanos && (
                <p className="text-[10px] text-red-600 mt-0.5">{errors.descripcionDanos}</p>
              )}
            </div>
          </div>

          {/* Section: Prueba de impresión del cabezal */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t -mx-4 -mt-4 mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                Prueba de impresión del cabezal
              </span>
              <span className="text-[10px] text-slate-300 font-normal">
                Verificación de puntos térmicos y calidad de impresión
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnóstico y Resultado de la Prueba de Cabezal
                </label>
                <textarea
                  rows={2}
                  value={pruebaCabezalResultado}
                  onChange={(e) => setPruebaCabezalResultado(e.target.value)}
                  placeholder="Cabezal 100% operativo sin puntos muertos o quemados..."
                  className="w-full text-xs border border-slate-300 rounded p-2 focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
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
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Adjuntar Foto o Escaneo de Muestra
                  </button>
                  {pruebaCabezalImagen && (
                    <button
                      type="button"
                      onClick={() => setPruebaCabezalImagen(undefined)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              {/* Preview box representing the physical test sheet area */}
              <div className="border border-dashed border-slate-300 bg-slate-50 rounded-md p-3 flex flex-col items-center justify-center min-h-[110px] text-center">
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
                    <p className="text-[11px] font-medium text-slate-600">Área de comprobante de cabezal térmico</p>
                    <p className="text-[10px] text-slate-400">
                      Puede adjuntar una fotografía de la etiqueta de prueba o se generará el patrón técnico en el PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Signatures & Contact Info (Matches Footer of Image) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Firmas de Conformidad y Recepción
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cliente */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2.5">
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
                  label="Firma del Cliente"
                  initialSignature={clienteFirma}
                  onSave={(dataUrl) => setClienteFirma(dataUrl)}
                  onClear={() => setClienteFirma(undefined)}
                />
              </div>

              {/* Ingeniero SOTEX */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  Nombre y firma (Ing. SOTEX)
                </span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Nombre del Ingeniero Técnico
                  </label>
                  <input
                    type="text"
                    value={tecnicoNombre}
                    onChange={(e) => setTecnicoNombre(e.target.value)}
                    placeholder="Ing. Javier Rojas"
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-[#D60000] focus:border-[#D60000] focus:outline-hidden"
                  />
                </div>
                <div className="text-[11px] text-slate-500 bg-slate-100 p-1.5 rounded border border-slate-200">
                  <p><strong>Contacto SOTEX:</strong> soporteqdl@sotex.com.mx</p>
                  <p><strong>Portal:</strong> www.sotex.com.mx</p>
                </div>
                <SignaturePad
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
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md shadow-xs transition-colors"
            >
              Guardar Registro
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#D60000] hover:bg-[#b50000] rounded-md shadow-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Guardar y Exportar a PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
