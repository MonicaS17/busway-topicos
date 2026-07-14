import { useState, useEffect } from 'react';
import { auth } from '../../../config/firebase';
import api from '../../../config/api';

export default function useRuta({ usuario, esPadre, selectedHijoId, selectedRutaId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rutaInfo, setRutaInfo] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [hijos, setHijos] = useState([]);
  const [conductorInfo, setConductorInfo] = useState(null);
  const [activeTripInitial, setActiveTripInitial] = useState(null);
  const [faseViaje, setFaseViaje] = useState('sin_viaje');
  const [token, setToken] = useState(null);               

  const [rutas, setRutas] = useState([]);
  const [rutaSeleccionadaId, setRutaSeleccionadaId] = useState(null);

  useEffect(() => {
    if (!esPadre && selectedRutaId && selectedRutaId !== rutaSeleccionadaId) {
      setRutaSeleccionadaId(selectedRutaId);
    }
  }, [esPadre, selectedRutaId]);

  useEffect(() => {
    if (!usuario) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!auth.currentUser) {
          setError('Por favor, inicia sesión para continuar.');
          setLoading(false);
          return;
        }

        const idToken = await auth.currentUser.getIdToken();
        setToken(idToken); // Guardar para revalidación en foreground

        if (esPadre) {
          // ─── LOGICA DE PADRE ─────────────────────────────────────────────────────────
          const resHijos = await api.get('/api/padre/mis-hijos', {
            headers: { Authorization: `Bearer ${idToken}` }
          });

          if (!resHijos.data || !resHijos.data.hijos || resHijos.data.hijos.length === 0) {
            setError('No tienes hijos registrados actualmente.');
            setLoading(false);
            return;
          }

          const hijosObtenidos = resHijos.data.hijos;
          setHijos(hijosObtenidos);

          let activeHijo = null;
          if (selectedHijoId) {
            activeHijo = hijosObtenidos.find(
              (h) => String(h._id) === String(selectedHijoId) || String(h.id) === String(selectedHijoId)
            );
          }
          if (!activeHijo) {
            activeHijo = hijosObtenidos[0];
          }

          const activeRutaId = activeHijo.ruta_id && typeof activeHijo.ruta_id === 'object'
            ? activeHijo.ruta_id._id
            : activeHijo.ruta_id;

          const condId = activeHijo.conductor_id && typeof activeHijo.conductor_id === 'object'
            ? activeHijo.conductor_id._id
            : activeHijo.conductor_id;

          if (!condId) {
            setError('Este estudiante no tiene un conductor asignado actualmente.');
            setLoading(false);
            return;
          }

          if (!activeRutaId) {
            setError('Este estudiante no tiene una ruta asignada actualmente.');
            setLoading(false);
            return;
          }

          // Obtener perfil conductor
          try {
            const resPerfil = await api.get(`/api/conductor/${condId}/perfil`, {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            if (resPerfil.data) {
              setConductorInfo(resPerfil.data.conductor);
            }
          } catch (err) {
            console.log('Error fetching conductor profile:', err.message);
          }

          // Obtener ruta del conductor
          let rInfo = null;
          try {
            const resRuta = await api.get(`/api/conductor/${condId}/ruta?ruta_id=${activeRutaId}`, {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            if (resRuta.data && resRuta.data.ruta) {
              rInfo = resRuta.data.ruta;
              setRutaInfo(rInfo);
              setEstudiantes(resRuta.data.estudiantes || []);
            }
          } catch (err) {
            console.log('Error fetching route info:', err.message);
          }

          if (!rInfo) {
            setError('El conductor asignado no tiene una ruta configurada.');
            setLoading(false);
            return;
          }

          // Obtener viaje activo con nueva estructura { viaje, fase }
          try {
            const resViaje = await api.get(`/api/viajes/activo/padre?estudiante_id=${activeHijo._id}&ruta_id=${activeRutaId}`, {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            const respData = resViaje.data;
            if (respData && respData.viaje) {
              setActiveTripInitial(respData.viaje);
              setFaseViaje(respData.fase || 'activo');
            } else {
              setActiveTripInitial(null);
              setFaseViaje(respData?.fase || 'sin_viaje');
            }
          } catch (err) {
            console.log('Error fetching active trip for parent:', err.message);
          }

        } else {
          // ─── LOGICA DE CONDUCTOR ─────────────────────────────────────────────────────────
          const url = rutaSeleccionadaId
            ? `/api/conductor/ruta?id_ruta=${rutaSeleccionadaId}`
            : '/api/conductor/ruta';
          const resRuta = await api.get(url, {
            headers: { Authorization: `Bearer ${idToken}` }
          });

          if (!resRuta.data || !resRuta.data.ruta) {
            setError('No tienes rutas asignadas actualmente.');
            setLoading(false);
            return;
          }

          const r = resRuta.data.ruta;
          setRutaInfo(r);
          setRutas(resRuta.data.rutas || []);

          let estudiantesList = [];
          if (resRuta.data && resRuta.data.estudiantes && resRuta.data.estudiantes.length > 0) {
            estudiantesList = resRuta.data.estudiantes.map((e, idx) => ({
              ...e,
              id: e._id,
              _id: e._id,
              orden: e.orden || (idx + 1)
            }));
          }

          if (estudiantesList.length > 0) {
            setEstudiantes(estudiantesList);
          } else {
            const resEst = await api.get('/api/conductor/estudiantes', {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            const estudiantesObtenidos = resEst.data?.estudiantes || [];
            setEstudiantes(estudiantesObtenidos.map((e, idx) => ({
              ...e,
              id: e._id,
              _id: e._id,
              orden: idx + 1
            })));
          }

          try {
            const resViaje = await api.get('/api/viajes/activo/conductor', {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            const respData = resViaje.data;
            if (respData && respData.viaje) {
              setActiveTripInitial(respData.viaje);
              setFaseViaje(respData.fase || 'activo');
            } else {
              setActiveTripInitial(null);
              setFaseViaje(respData?.fase || 'sin_viaje');
            }
          } catch (err) {
            console.log('No active trip found on startup:', err.message);
          }
        }

      } catch (err) {
        console.error('Error loading route/viaje details:', err);
        setError('Error al obtener la información.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [usuario, esPadre, rutaSeleccionadaId, selectedHijoId, selectedRutaId]);


  return {
    loading,
    error,
    rutaInfo,
    setRutaInfo,
    rutas,
    rutaSeleccionadaId,
    setRutaSeleccionadaId,
    estudiantes,
    hijos,
    conductorInfo,
    activeTripInitial,
    faseViaje,
    token,   
    setEstudiantes
  };
}
