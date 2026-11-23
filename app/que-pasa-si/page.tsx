import { Simulador } from "@/components/simulador";
import { Encabezado } from "@/components/ui";
import { obtenerEstado } from "@/lib/api";

export default async function QuePasaSi() {
  const { oficinas, meta } = await obtenerEstado();
  return (
    <>
      <Encabezado
        titulo="¿Qué pasa si muevo a alguien?"
        sub="Prueba un movimiento antes de aprobarlo y mira cómo cambia la espera estimada. Nada se envía hasta que tú lo apruebes."
      />
      <Simulador oficinas={oficinas} meta={meta} />
    </>
  );
}