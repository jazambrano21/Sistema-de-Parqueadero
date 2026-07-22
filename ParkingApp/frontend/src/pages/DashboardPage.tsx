import { useEffect, useState, useCallback } from 'react';
import {
  Ticket,
  Car,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { ticketService } from '../services/ticketService';
import { espacioService } from '../services/espacioService';
import { zonaService } from '../services/zonaService';
import { vehiculoService } from '../services/vehiculoService';
import Spinner from '../components/Spinner';
import type { Ticket as TTicket, Espacio, Zona } from '../types';
import { getErrorMessage } from '../lib/api';
import toast from 'react-hot-toast';

interface Stats {
  ticketsActivos: number;
  ticketsHoy: number;
  espaciosDisponibles: number;
  espaciosOcupados: number;
  espaciosTotal: number;
  totalZonas: number;
  totalVehiculos: number;
  recaudadoHoy: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ticketsActivos, setTicketsActivos] = useState<TTicket[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [tickets, activos, espaciosList, zonasList, vehiculos] = await Promise.all([
        ticketService.listar(),
        ticketService.listarActivos(),
        espacioService.listar(),
        zonaService.listar(),
        vehiculoService.listar(),
      ]);

      const hoy = new Date().toDateString();
      const ticketsHoy = tickets.filter(
        (t) => new Date(t.fechaHoraIngreso).toDateString() === hoy,
      );
      const recaudadoHoy = ticketsHoy
        .filter((t) => !t.activo)
        .reduce((sum, t) => sum + (t.valorRecaudado ?? 0), 0);

      setStats({
        ticketsActivos: activos.length,
        ticketsHoy: ticketsHoy.length,
        espaciosDisponibles: espaciosList.filter((e) => e.estado === 'DISPONIBLE').length,
        espaciosOcupados: espaciosList.filter((e) => e.estado === 'OCUPADO').length,
        espaciosTotal: espaciosList.length,
        totalZonas: zonasList.length,
        totalVehiculos: vehiculos.length,
        recaudadoHoy,
      });
      setTicketsActivos(activos.slice(0, 8));
      setZonas(zonasList);
      setEspacios(espaciosList);
      setLastUpdate(new Date());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) return <Spinner text="Cargando dashboard…" />;

  const ocupacion = stats
    ? Math.round((stats.espaciosOcupados / (stats.espaciosTotal || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Última actualización: {lastUpdate.toLocaleTimeString('es-EC')}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Tickets activos"
          value={stats?.ticketsActivos ?? 0}
          sub="Vehículos en el parqueadero"
          color="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Espacios libres"
          value={stats?.espaciosDisponibles ?? 0}
          sub={`de ${stats?.espaciosTotal ?? 0} totales`}
          color="bg-green-500"
        />
        <StatCard
          icon={XCircle}
          label="Espacios ocupados"
          value={stats?.espaciosOcupados ?? 0}
          sub={`${ocupacion}% de ocupación`}
          color="bg-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Recaudado hoy"
          value={`$${(stats?.recaudadoHoy ?? 0).toFixed(2)}`}
          sub={`${stats?.ticketsHoy ?? 0} tickets hoy`}
          color="bg-violet-500"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={MapPin} label="Zonas" value={stats?.totalZonas ?? 0} color="bg-amber-500" />
        <StatCard icon={Car} label="Vehículos registrados" value={stats?.totalVehiculos ?? 0} color="bg-teal-500" />
        <StatCard
          icon={Clock}
          label="Tickets hoy"
          value={stats?.ticketsHoy ?? 0}
          sub="entradas registradas"
          color="bg-indigo-500"
        />
      </div>

      {/* Barra de ocupación */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Ocupación general</h3>
          <span className="text-2xl font-bold text-slate-800">{ocupacion}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{
              width: `${ocupacion}%`,
              backgroundColor:
                ocupacion < 60 ? '#22c55e' : ocupacion < 85 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>0%</span>
          <span className="text-green-600">Óptimo &lt;60%</span>
          <span className="text-amber-600">Alerta &lt;85%</span>
          <span className="text-red-600">Crítico ≥85%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets activos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Tickets activos</h3>
          {ticketsActivos.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No hay vehículos en el parqueadero</p>
          ) : (
            <div className="space-y-2">
              {ticketsActivos.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Car className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.placa}</p>
                      <p className="text-xs text-slate-400">{t.nombreZona}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {new Date(t.fechaHoraIngreso).toLocaleTimeString('es-EC', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-slate-400">{t.dni}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mapa de zonas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Estado por zona</h3>
          <div className="space-y-3">
            {zonas.slice(0, 6).map((zona) => {
              const esp = espacios.filter((e) => e.zona?.id === zona.id);
              const libres = esp.filter((e) => e.estado === 'DISPONIBLE').length;
              const ocupados = esp.filter((e) => e.estado === 'OCUPADO').length;
              const pct = esp.length ? Math.round((ocupados / esp.length) * 100) : 0;
              return (
                <div key={zona.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{zona.nombre}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {zona.tipo}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {libres} libres / {esp.length} total
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct < 60 ? '#22c55e' : pct < 85 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {zonas.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">No hay zonas registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
