import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const telefonoNegocio = "5492914496333";

const horariosBase = [
  "09:30",
  "11:00",
  "14:00",
  "15:30"
];

const horarioExtra = "17:00";

let horaSeleccionada = "";

document.addEventListener("DOMContentLoaded", () => {

  const fechaInput = document.getElementById("fecha");
  const horariosDiv = document.getElementById("horarios");

  fechaInput.addEventListener("change", mostrarHorarios);

  async function mostrarHorarios() {

    horariosDiv.innerHTML = "";

    let fecha = fechaInput.value;

    if (!fecha) return;

    let dia = new Date(fecha + "T00:00").getDay();

    if (dia === 0 || dia === 6) {
      horariosDiv.innerHTML = "No hay turnos disponibles este día";
      return;
    }

    let horarios = [...horariosBase];

    if (dia === 1 || dia === 3 || dia === 5) {
      horarios.push(horarioExtra);
    }

    for (let h of horarios) {

      const q = query(
        collection(db, "turnos"),
        where("fecha", "==", fecha),
        where("hora", "==", h)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {

        let div = document.createElement("div");
        div.className = "slot";
        div.innerText = h;

        div.onclick = () => {
          horaSeleccionada = h;
          alert("Horario seleccionado: " + h);
        };

        horariosDiv.appendChild(div);

      }

    }

  }

  window.reservar = async function () {

    let nombre = document.getElementById("nombre").value;
    let telefono = document.getElementById("telefono").value;
    let fecha = fechaInput.value;

    if (!nombre || !telefono || !fecha || !horaSeleccionada) {
      alert("Completa todos los datos");
      return;
    }

    const check = query(
      collection(db, "turnos"),
      where("fecha", "==", fecha),
      where("hora", "==", horaSeleccionada)
    );

    const existe = await getDocs(check);

    if (!existe.empty) {
      alert("Ese horario ya fue reservado");
      mostrarHorarios();
      return;
    }

    await addDoc(collection(db, "turnos"), {
      nombre: nombre,
      telefono: telefono,
      fecha: fecha,
      hora: horaSeleccionada
    });

    let mensaje = `Hola Gonzalo quiero reservar turno

Nombre: ${nombre}
Teléfono: ${telefono}
Fecha: ${fecha}
Hora: ${horaSeleccionada}`;

    let url = `https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(mensaje)}`;

    window.open(url);

    mostrarHorarios();
  };

});
