import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const telefonoNegocio = "5492914496333";

const horariosBase = ["09:30", "11:00", "14:00", "15:30"];
const horarioExtra = "17:00";

let horaSeleccionada = "";

document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const horariosDiv = document.getElementById("horarios");
  const nombreInput = document.getElementById("nombre");
  const telefonoInput = document.getElementById("telefono");

  // Evita elegir fechas pasadas
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  fechaInput.min = `${yyyy}-${mm}-${dd}`;

  fechaInput.addEventListener("change", mostrarHorarios);

  function parseFechaLocal(fechaStr) {
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  async function mostrarHorarios() {
    horariosDiv.innerHTML = "";
    horaSeleccionada = "";

    const fecha = fechaInput.value;
    if (!fecha) return;

    const fechaObj = parseFechaLocal(fecha);
    const diaSemana = fechaObj.getDay();

    // 0 domingo, 6 sábado
    if (diaSemana === 0 || diaSemana === 6) {
      horariosDiv.innerHTML = "No hay turnos disponibles este día";
      return;
    }

    const horarios = [...horariosBase];
    if ([1, 3, 5].includes(diaSemana)) {
      horarios.push(horarioExtra);
    }

    for (const hora of horarios) {
      const q = query(
        collection(db, "turnos"),
        where("fecha", "==", fecha),
        where("hora", "==", hora)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const div = document.createElement("div");
        div.className = "slot";
        div.textContent = hora;

        div.addEventListener("click", () => {
          horaSeleccionada = hora;

          document.querySelectorAll(".slot").forEach(el => {
            el.style.outline = "none";
          });

          div.style.outline = "3px solid #0b3d91";
        });

        horariosDiv.appendChild(div);
      }
    }

    if (horariosDiv.innerHTML === "") {
      horariosDiv.innerHTML = "No hay horarios disponibles para esta fecha";
    }
  }

  window.reservar = async function () {
    const nombre = nombreInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const fecha = fechaInput.value;

    if (!nombre || !telefono || !fecha || !horaSeleccionada) {
      alert("Completá nombre, teléfono, fecha y horario");
      return;
    }

    const q = query(
      collection(db, "turnos"),
      where("fecha", "==", fecha),
      where("hora", "==", horaSeleccionada)
    );

    const existente = await getDocs(q);

    if (!existente.empty) {
      alert("Ese horario ya no está disponible");
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

    await mostrarHorarios();
  };
});