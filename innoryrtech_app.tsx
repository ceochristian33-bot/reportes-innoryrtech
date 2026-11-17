import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  LayoutDashboard, 
  ShieldCheck, 
  CheckCircle2,
  Wrench,
  Calendar,
  User,
  MapPin,
  Settings2,
  FileText,
  Package,
  Lightbulb,
  Clock
} from 'lucide-react';

// --- FIREBASE SETUP ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';

// Initialize Firebase outside the component to prevent re-initialization
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'innoryrtech-app-default';

// --- INITIAL STATES ---
const initialFormState = {
  fecha: new Date().toISOString().split('T')[0],
  tecnico: '',
  cliente: '',
  tipoServicio: '',
  categoriaEquipo: '',
  descripcion: '',
  materiales: '',
  recomendaciones: ''
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState('form'); // 'form' or 'dashboard'
  const [formData, setFormData] = useState(initialFormState);
  const [reports, setReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // --- FIREBASE AUTHENTICATION (RULE 3: Auth First) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };
    
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // --- FIREBASE DATA FETCHING (RULE 1 & 2: Strict Paths, No Complex Queries) ---
  useEffect(() => {
    if (!user) return;

    // Use strict public path so all admins/techs can see the reports
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    
    const unsubscribe = onSnapshot(reportsRef, 
      (snapshot) => {
        const fetchedReports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory (newest first)
        fetchedReports.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setReports(fetchedReports);
      },
      (error) => {
        console.error("Error fetching reports:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Error: Usuario no autenticado.");
      return;
    }

    setSubmitting(true);
    try {
      const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
      await addDoc(reportsRef, {
        ...formData,
        timestamp: Date.now(),
        userId: user.uid
      });
      
      setFormData(initialFormState); // Reset form
      showToast("¡Reporte guardado exitosamente!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error adding document: ", error);
      showToast("Error al guardar el reporte.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI COMPONENTS ---
  const InputGroup = ({ icon: Icon, label, children }) => (
    <div className="mb-4">
      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
        <Icon className="w-4 h-4 mr-2 text-blue-800" />
        {label}
      </label>
      {children}
    </div>
  );

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <ShieldCheck className="w-16 h-16 text-blue-900 animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-blue-900">Cargando INNORYRTECH...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* HEADER */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-8 h-8 text-blue-300" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">INNORYRTECH S.A.S.</h1>
                <p className="text-xs text-blue-200 hidden sm:block">Seguridad Electrónica y Domótica</p>
              </div>
            </div>
            
            {/* NAVIGATION TABS */}
            <div className="flex space-x-1 sm:space-x-2 bg-blue-800 p-1 rounded-lg">
              <button
                onClick={() => setView('form')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'form' ? 'bg-white text-blue-900 shadow' : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                <ClipboardList className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Formulario</span>
              </button>
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'dashboard' ? 'bg-white text-blue-900 shadow' : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW: FORM */}
        {view === 'form' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Reporte de Intervención Técnica</h2>
                  <p className="text-sm text-gray-500">Complete todos los campos para registrar el servicio.</p>
                </div>
                <Wrench className="w-6 h-6 text-gray-400 hidden sm:block" />
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fecha */}
                  <InputGroup icon={Calendar} label="Fecha de Intervención">
                    <input
                      type="date"
                      name="fecha"
                      required
                      value={formData.fecha}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </InputGroup>

                  {/* Técnico */}
                  <InputGroup icon={User} label="Nombre del Técnico">
                    <input
                      type="text"
                      name="tecnico"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={formData.tecnico}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </InputGroup>
                </div>

                {/* Cliente / Conjunto */}
                <InputGroup icon={MapPin} label="Nombre del Cliente / Conjunto Residencial">
                  <input
                    type="text"
                    name="cliente"
                    required
                    placeholder="Ej. Conjunto Residencial Los Pinos / Empresa ABC"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </InputGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de Servicio */}
                  <InputGroup icon={Settings2} label="Tipo de Servicio">
                    <select
                      name="tipoServicio"
                      required
                      value={formData.tipoServicio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      <option value="" disabled>Seleccione una opción...</option>
                      <option value="Instalación Nueva">Instalación Nueva</option>
                      <option value="Reparación">Reparación</option>
                      <option value="Visita Técnica">Visita Técnica</option>
                      <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                    </select>
                  </InputGroup>

                  {/* Categoría de Equipos */}
                  <InputGroup icon={ShieldCheck} label="Categoría de Equipos">
                    <select
                      name="categoriaEquipo"
                      required
                      value={formData.categoriaEquipo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    >
                      <option value="" disabled>Seleccione una categoría...</option>
                      <option value="CCTV">CCTV (Cámaras)</option>
                      <option value="Control de Acceso">Control de Acceso</option>
                      <option value="Motores BFT / Puertas">Motores BFT / Automatización</option>
                      <option value="Detección de Incendio">Detección de Incendio</option>
                      <option value="Alarmas Intrusión">Alarmas de Intrusión</option>
                      <option value="Citofonía">Citofonía</option>
                      <option value="Domótica (General)">Domótica (General)</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </InputGroup>
                </div>

                {/* Descripción del Trabajo */}
                <InputGroup icon={FileText} label="Descripción detallada del trabajo realizado">
                  <textarea
                    name="descripcion"
                    required
                    rows="3"
                    placeholder="Describa el problema inicial y las acciones tomadas..."
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                  ></textarea>
                </InputGroup>

                {/* Materiales Utilizados */}
                <InputGroup icon={Package} label="Materiales o Repuestos Utilizados">
                  <textarea
                    name="materiales"
                    rows="2"
                    placeholder="Ej. 10m de cable UTP, 2 conectores BNC (Deje en blanco si no aplica)"
                    value={formData.materiales}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                  ></textarea>
                </InputGroup>

                {/* Recomendaciones */}
                <InputGroup icon={Lightbulb} label="Recomendaciones para el Cliente">
                  <textarea
                    name="recomendaciones"
                    rows="2"
                    placeholder="Sugerencias de mejora, próximos mantenimientos, precauciones..."
                    value={formData.recomendaciones}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                  ></textarea>
                </InputGroup>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-all ${
                      submitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <Clock className="animate-spin w-5 h-5 mr-2" />
                        Guardando...
                      </span>
                    ) : (
                      'Guardar y Enviar Reporte'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h2>
                <p className="text-gray-500">Historial de intervenciones y reportes técnicos.</p>
              </div>
              <div className="mt-4 sm:mt-0 bg-white px-4 py-2 rounded-lg shadow border border-gray-200 flex items-center">
                <FileText className="w-5 h-5 text-blue-800 mr-2" />
                <span className="font-semibold text-gray-700">Total Reportes: {reports.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha / Técnico</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Servicio / Equipo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                          <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                          No hay reportes registrados aún.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">{report.fecha}</div>
                            </div>
                            <div className="flex items-center mt-1">
                              <User className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm text-gray-500">{report.tecnico}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-semibold">{report.cliente}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              report.tipoServicio === 'Instalación Nueva' ? 'bg-green-100 text-green-800' :
                              report.tipoServicio === 'Reparación' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {report.tipoServicio}
                            </span>
                            <div className="text-sm text-gray-500 mt-1">{report.categoriaEquipo}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 line-clamp-2" title={report.descripcion}>
                              <span className="font-semibold">Trabajo:</span> {report.descripcion}
                            </div>
                            {report.materiales && (
                              <div className="text-sm text-gray-500 mt-1 line-clamp-1" title={report.materiales}>
                                <span className="font-semibold">Materiales:</span> {report.materiales}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-gray-400 py-6 text-center text-sm">
        <p>© {new Date().getFullYear()} INNORYRTECH S.A.S. - Sistema de Gestión Técnica</p>
      </footer>

      {/* GLOBALS FOR ANIMATION - Adding minimal inline css for simple animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}} />
    </div>
  );
}