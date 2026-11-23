export type Oficina = {
  id: string;
  nombre: string;
  s: number;
  llegadas: number[];
  hay: number;
};

export const TIPOS_AUSENCIA = ["Incapacidad", "Permiso", "Vacaciones", "Otra"] as const;
export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number];

export type Ausencia = {
  id: string;
  colaborador: string;
  oficinaId: string;
  tipo: TipoAusencia;
  desde: string;
  hasta: string;
};

export type NuevaAusencia = Omit<Ausencia, "id">;

export type EstadoSugerencia = "pendiente" | "aprobada" | "rechazada";
export type Modalidad = "presencial" | "virtual";

export type Sugerencia = {
  id: string;
  origenId: string;
  destinoId: string;
  personas: number;
  modalidad: Modalidad;
  estado: EstadoSugerencia;
};

export type Franja = {
  id: string;
  inicio: number;
  fin: number;
  pico: boolean;
};

export type Estado = {
  meta: number;
  oficinas: Oficina[];
  ausencias: Ausencia[];
  sugerencias: Sugerencia[];
};