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

/*
  OPCIONAL:
  Si después armás un webhook en Make / Zapier / Cloud Function,
  pegá la URL acá y se enviará un POST automático al reservar.
*/
const webhookUrl = "https://hook.us2.make.com/v1y9t25fj5br5xt4sxmms0qe70cnuz3i";

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

  function horaAMinutos(horaStr) {
    const [h, m] = horaStr.split(":").map(Number);
    return h * 60 + m;
  }

  function hoyStrLocal() {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  }

  async function notificarReservaWebhook(payload) {
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Error enviando webhook:", error);
    }
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
    if ([1, 3, 5].includes(diaSemana)) {
      horarios.push(horarioExtra);
    }

    const hoy = hoyStrLocal();
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

    let disponibles = 0;

    try {
      for (const hora of horarios) {
        const horarioPasado = fecha === hoy && horaAMinutos(hora) <= minutosActuales;

        if (horarioPasado) continue;

        const q = query(
          collection(db, "turnos"),
          where("fecha", "==", fecha),
          where("hora", "==", hora)
        );

        const snapshot = await getDocs(q);

        let ocupado = false;
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.estado === "reservado" || data.estado === "bloqueado") {
            ocupado = true;
          }
        });

        if (!ocupado) {
          disponibles++;

          const div = document.createElement("div");
          div.className = "slot";
          div.textContent = hora;

          div.addEventListener("click", () => {
            horaSeleccionada = hora;
            document.querySelectorAll(".slot").forEach((el) => el.classList.remove("seleccionado"));
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
      const check = query(
        collection(db, "turnos"),
        where("fecha", "==", fecha),
        where("hora", "==", horaSeleccionada)
      );

      const existe = await getDocs(check);

      let ocupado = false;
      existe.forEach((d) => {
        const data = d.data();
        if (data.estado === "reservado" || data.estado === "bloqueado") {
          ocupado = true;
        }
      });

      if (ocupado) {
        alert("Ese horario ya fue reservado");
        await mostrarHorarios();
        return;
      }

      const payload = {
        nombre,
        telefono,
        fecha,
        hora: horaSeleccionada,
        estado: "reservado",
        origen: "online",
        notas: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "turnos"), payload);

      await notificarReservaWebhook(payload);

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