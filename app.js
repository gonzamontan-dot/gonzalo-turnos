import { db } from "./firebase.js";
import { collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const telefonoNegocio = "5492914496333";
const horariosBase = ["09:30","11:00","14:00","15:30"];
const horarioExtra = "17:00";

let horaSeleccionada = "";

document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const horariosDiv = document.getElementById("horarios");
  const nombreInput = document.getElementById("nombre");
  const telefonoInput = document.getElementById("telefono");
  const btnReservar = document.getElementById("btnReservar");

  fechaInput.addEventListener("change", mostrarHorarios);
  btnReservar.addEventListener("click", reservar);

  function parseFechaLocal(fechaStr) {
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  async function mostrarHorarios() {
    horariosDiv.innerHTML = "";
    horaSeleccionada = "";

    const fecha = fechaInput.value;
    if (!fecha) {
      horariosDiv.innerHTML = '<div class="mensaje">Elegí una fecha para ver los horarios disponibles</div>';
      return;
    }

    const fechaObj = parseFechaLocal(fecha);
    const diaSemana = fechaObj.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
      horariosDiv.innerHTML = '<div class="mensaje">No hay turnos disponibles este día</div>';
      return;
    }

    const horarios = [...horariosBase];
    if ([1,3,5].includes(diaSemana)) horarios.push(horarioExtra);

    let disponibles = 0;

    try {
      for (const hora of horarios) {
        const q = query(collection(db, "turnos"), where("fecha", "==", fecha), where("hora", "==", hora));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          disponibles++;
          const div = document.createElement("div");
          div.className = "slot";
          div.textContent = hora;
          div.addEventListener("click", () => {
            horaSeleccionada = hora;
            document.querySelectorAll(".slot").forEach(el => el.classList.remove("seleccionado"));
            div.classList.add("seleccionado");
          });
          horariosDiv.appendChild(div);
        }
      }

      if (disponibles === 0) {
        horariosDiv.innerHTML = '<div class="mensaje">No hay horarios disponibles para esta fecha</div>';
      }
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      horariosDiv.innerHTML = '<div class="mensaje error">No se pudieron cargar los horarios. Revisá firebase.js o las reglas de Firestore.</div>';
    }
  }

  async function reservar() {
    const nombre = nombreInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const fecha = fechaInput.value;

    if (!nombre || !telefono || !fecha || !horaSeleccionada) {
      alert("Completá nombre, teléfono, fecha y horario");
      return;
    }

    btnReservar.disabled = true;
    btnReservar.textContent = "Guardando...";

    try {
      const check = query(collection(db, "turnos"), where("fecha", "==", fecha), where("hora", "==", horaSeleccionada));
      const existe = await getDocs(check);

      if (!existe.empty) {
        alert("Ese horario ya fue reservado");
        await mostrarHorarios();
        return;
      }

      await addDoc(collection(db, "turnos"), {
        nombre,
        telefono,
        fecha,
        hora: horaSeleccionada,
        creadoEn: new Date().toISOString()
      });

      const mensaje = `Hola Gonzalo quiero reservar turno

Nombre: ${nombre}
Teléfono: ${telefono}
Fecha: ${fecha}
Hora: ${horaSeleccionada}`;

      const url = `https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");

      nombreInput.value = "";
      telefonoInput.value = "";
      horaSeleccionada = "";

      alert("Turno reservado correctamente");
      await mostrarHorarios();
    } catch (error) {
      console.error("Error al reservar:", error);
      alert("No se pudo guardar el turno. Revisá firebase.js y las reglas de Firestore.");
    } finally {
      btnReservar.disabled = false;
      btnReservar.textContent = "Reservar turno";
    }
  }

  mostrarHorarios();
});
