import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const passwordAdmin = "gonzalo123";
const telefonoNegocio = "5492914496333";

const horariosBase = ["09:30", "11:00", "14:00", "15:30"];
const horarioExtra = "17:00";

const loginWrap = document.getElementById("loginWrap");
const panelWrap = document.getElementById("panelWrap");
const passInput = document.getElementById("pass");
const btnLogin = document.getElementById("btnLogin");

const listaMes = document.getElementById("listaMes");
const agenda = document.getElementById("agenda");
const fechaInput = document.getElementById("fecha");
const btnVerAgenda = document.getElementById("btnVerAgenda");
const btnPrevDia = document.getElementById("btnPrevDia");
const btnHoy = document.getElementById("btnHoy");
const btnNextDia = document.getElementById("btnNextDia");
const busquedaCliente = document.getElementById("busquedaCliente");

const countReservados = document.getElementById("countReservados");
const countBloqueados = document.getElementById("countBloqueados");
const countDisponibles = document.getElementById("countDisponibles");
const countMes = document.getElementById("countMes");
const fechaBonita = document.getElementById("fechaBonita");

let cacheMes = [];

function parseFechaLocal(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function formatFechaISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function horaAMinutos(horaStr) {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
}

function hoyStrLocal() {
  return formatFechaISO(new Date());
}

function formatFechaBonita(fechaStr) {
  const fecha = parseFechaLocal(fechaStr);
  return fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function abrirWhatsAppCliente(telefono, nombre, fecha, hora) {
  if (!telefono) {
    alert("Este turno no tiene teléfono cargado");
    return;
  }

  const limpio = telefono.replace(/\D/g, "");
  const mensaje = `Hola ${nombre || ""}, te escribo de Gonzalo Masoterapia por tu turno del ${fecha} a las ${hora}.`;
  const url = `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

async function limpiarTurnosViejos() {
  const snapshot = await getDocs(collection(db, "turnos"));

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;

  for (const item of snapshot.docs) {
    const data = item.data();
    if (!data.fecha) continue;

    const [anio, mes] = data.fecha.split("-").map(Number);

    if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
      await deleteDoc(doc(db, "turnos", item.id));
    }
  }
}

btnLogin.addEventListener("click", async () => {
  if (passInput.value !== passwordAdmin) {
    alert("Contraseña incorrecta");
    return;
  }

  loginWrap.style.display = "none";
  panelWrap.style.display = "flex";

  fechaInput.value = hoyStrLocal();

  try {
    await limpiarTurnosViejos();
    await cargarMes();
    await cargarAgenda();
  } catch (error) {
    console.error("Error iniciando admin:", error);
    alert("Se abrió el panel, pero hubo un problema al cargar Firebase.");
  }
});

btnVerAgenda.addEventListener("click", cargarAgenda);

btnHoy.addEventListener("click", async () => {
  fechaInput.value = hoyStrLocal();
  await cargarAgenda();
});

btnPrevDia.addEventListener("click", async () => {
  if (!fechaInput.value) fechaInput.value = hoyStrLocal();
  const d = parseFechaLocal(fechaInput.value);
  d.setDate(d.getDate() - 1);
  fechaInput.value = formatFechaISO(d);
  await cargarAgenda();
});

btnNextDia.addEventListener("click", async () => {
  if (!fechaInput.value) fechaInput.value = hoyStrLocal();
  const d = parseFechaLocal(fechaInput.value);
  d.setDate(d.getDate() + 1);
  fechaInput.value = formatFechaISO(d);
  await cargarAgenda();
});

busquedaCliente.addEventListener("input", () => {
  renderListaMes(cacheMes);
});

function renderListaMes(items) {
  const filtro = busquedaCliente.value.trim().toLowerCase();

  const filtrados = items.filter((t) => {
    const nombre = (t.nombre || "").toLowerCase();
    const telefono = (t.telefono || "").toLowerCase();
    return nombre.includes(filtro) || telefono.includes(filtro);
  });

  countMes.textContent = String(filtrados.length);

  if (filtrados.length === 0) {
    listaMes.innerHTML = '<div class="mensaje">No hay resultados</div>';
    return;
  }

  listaMes.innerHTML = "";

  filtrados.forEach((t) => {
    const div = document.createElement("div");
    div.className = "mes-item";

    const estadoClass =
      t.estado === "bloqueado"
        ? "estado-bloqueado"
        : t.estado === "realizado"
        ? "estado-realizado"
        : "estado-reservado";

    div.innerHTML = `
      <strong>${t.fecha}</strong><br>
      ${t.hora} - ${t.nombre}<br>
      📱 ${t.telefono || "-"}<br>
      <span class="estado-pill ${estadoClass}">${t.estado || "reservado"}</span>
    `;

    listaMes.appendChild(div);
  });
}

async function cargarMes() {
  listaMes.innerHTML = "Cargando...";

  try {
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const snapshot = await getDocs(collection(db, "turnos"));
    const items = [];

    snapshot.forEach((d) => {
      const t = d.data();
      if (!t.fecha) return;

      const [anio, mes] = t.fecha.split("-").map(Number);

      if (anio === anioActual && mes === mesActual && t.estado !== "cancelado") {
        items.push({ id: d.id, ...t });
      }
    });

    items.sort((a, b) => (`${a.fecha} ${a.hora}`).localeCompare(`${b.fecha} ${b.hora}`));

    cacheMes = items;
    renderListaMes(cacheMes);
  } catch (error) {
    console.error("Error cargando mes:", error);
    listaMes.innerHTML = '<div class="mensaje error">No se pudieron cargar los turnos del mes</div>';
  }
}

async function cargarAgenda() {
  const fecha = fechaInput.value;

  if (!fecha) {
    alert("Elegí una fecha");
    return;
  }

  fechaBonita.textContent = formatFechaBonita(fecha);
  agenda.innerHTML = '<div class="mensaje">Cargando agenda...</div>';

  const dia = parseFechaLocal(fecha).getDay();

  if (dia === 0 || dia === 6) {
    agenda.innerHTML = '<div class="mensaje">No trabajás este día</div>';
    countReservados.textContent = "0";
    countBloqueados.textContent = "0";
    countDisponibles.textContent = "0";
    return;
  }

  const horarios = [...horariosBase];
  if ([1, 3, 5].includes(dia)) horarios.push(horarioExtra);

  const hoy = hoyStrLocal();
  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  agenda.innerHTML = "";

  let reservados = 0;
  let bloqueados = 0;
  let disponibles = 0;

  for (const hora of horarios) {
    const card = document.createElement("div");
    const horarioPasado = fecha === hoy && horaAMinutos(hora) <= minutosActuales;

    if (horarioPasado) {
      bloqueados++;
      card.className = "slot-admin bloqueado";
      card.innerHTML = `
        <h3>${hora}</h3>
        <p><strong>Horario pasado</strong></p>
        <p>Ya no disponible</p>
      `;
      agenda.appendChild(card);
      continue;
    }

    try {
      const q = query(
        collection(db, "turnos"),
        where("fecha", "==", fecha),
        where("hora", "==", hora)
      );

      const snapshot = await getDocs(q);

      const activos = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.estado !== "cancelado" && data.estado !== "realizado") {
          activos.push({ id: d.id, ...data });
        }
      });

      if (activos.length === 0) {
        disponibles++;
        card.className = "slot-admin libre";
        card.innerHTML = `
          <h3>${hora}</h3>
          <p>Disponible</p>
          <div class="manual">
            <input class="nombre-manual" placeholder="Nombre del cliente">
            <input class="tel-manual" placeholder="Teléfono del cliente">
            <textarea class="nota-manual" placeholder="Notas del turno" rows="3"></textarea>
            <div class="acciones">
              <button type="button" class="btn-reservar-manual" data-fecha="${fecha}" data-hora="${hora}">Reservar manual</button>
              <button type="button" class="secondary btn-bloquear" data-fecha="${fecha}" data-hora="${hora}">Bloquear</button>
            </div>
          </div>
        `;
      } else {
        const t = activos[0];

        if (t.estado === "bloqueado") {
          bloqueados++;
          card.className = "slot-admin bloqueado";
          card.innerHTML = `
            <h3>${hora}</h3>
            <p><strong>Bloqueado</strong></p>
            <p>📱 -</p>
            <div class="acciones">
              <button type="button" class="danger btn-cancelar" data-id="${t.id}">Desbloquear</button>
            </div>
          `;
        } else {
          reservados++;
          card.className = "slot-admin ocupado";
          card.innerHTML = `
            <h3>${hora}</h3>
            <p><strong>${t.nombre}</strong></p>
            <p>📱 ${t.telefono || "-"}</p>
            ${t.notas ? `<p>📝 ${t.notas}</p>` : ""}
            <div class="acciones">
              <button type="button" class="danger btn-cancelar" data-id="${t.id}">Cancelar</button>
              <button type="button" class="secondary btn-realizado" data-id="${t.id}">Realizado</button>
              <button type="button" class="btn-whatsapp" data-tel="${t.telefono || ""}" data-nombre="${t.nombre || ""}" data-fecha="${t.fecha}" data-hora="${t.hora}">WhatsApp</button>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error("Error cargando horario:", hora, error);
      card.className = "slot-admin ocupado";
      card.innerHTML = `<h3>${hora}</h3><p>Error al consultar este horario</p>`;
    }

    agenda.appendChild(card);
  }

  countReservados.textContent = String(reservados);
  countBloqueados.textContent = String(bloqueados);
  countDisponibles.textContent = String(disponibles);
}

async function bloquear(fecha, hora) {
  try {
    const check = query(
      collection(db, "turnos"),
      where("fecha", "==", fecha),
      where("hora", "==", hora)
    );

    const existente = await getDocs(check);

    let activo = false;
    existente.forEach((d) => {
      const data = d.data();
      if (data.estado !== "cancelado" && data.estado !== "realizado") activo = true;
    });

    if (activo) {
      alert("Ese horario ya está ocupado o bloqueado");
      await cargarAgenda();
      return;
    }

    await addDoc(collection(db, "turnos"), {
      nombre: "Bloqueado",
      telefono: "-",
      fecha,
      hora,
      estado: "bloqueado",
      origen: "manual",
      notas: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    alert("Horario bloqueado");
    await cargarAgenda();
    await cargarMes();
  } catch (error) {
    console.error("Error bloqueando:", error);
    alert("No se pudo bloquear el horario");
  }
}

async function cancelar(id) {
  try {
    await updateDoc(doc(db, "turnos", id), {
      estado: "cancelado",
      updatedAt: new Date().toISOString()
    });

    alert("Turno cancelado");
    await cargarAgenda();
    await cargarMes();
  } catch (error) {
    console.error("Error cancelando:", error);
    alert("No se pudo cancelar el turno");
  }
}

async function marcarRealizado(id) {
  try {
    await updateDoc(doc(db, "turnos", id), {
      estado: "realizado",
      updatedAt: new Date().toISOString()
    });

    alert("Turno marcado como realizado");
    await cargarAgenda();
    await cargarMes();
  } catch (error) {
    console.error("Error marcando realizado:", error);
    alert("No se pudo actualizar el turno");
  }
}

async function crearManual(fecha, hora, nombre, telefono, notas, boton) {
  if (!nombre) {
    alert("Escribí el nombre del cliente");
    return;
  }

  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const check = query(
      collection(db, "turnos"),
      where("fecha", "==", fecha),
      where("hora", "==", hora)
    );

    const existente = await getDocs(check);

    let activo = false;
    existente.forEach((d) => {
      const data = d.data();
      if (data.estado !== "cancelado" && data.estado !== "realizado") activo = true;
    });

    if (activo) {
      alert("Ese horario ya está ocupado");
      await cargarAgenda();
      return;
    }

    await addDoc(collection(db, "turnos"), {
      nombre,
      telefono,
      fecha,
      hora,
      estado: "reservado",
      origen: "manual",
      notas: notas || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    alert("Turno creado correctamente");
    await cargarAgenda();
    await cargarMes();
  } catch (error) {
    console.error("Error creando manual:", error);
    alert("No se pudo crear el turno");
  } finally {
    boton.disabled = false;
    boton.textContent = "Reservar manual";
  }
}

agenda.addEventListener("click", async (e) => {
  const btnCancelar = e.target.closest(".btn-cancelar");
  if (btnCancelar) {
    const texto = btnCancelar.textContent.includes("Desbloquear")
      ? "¿Desbloquear horario?"
      : "¿Cancelar turno?";

    if (confirm(texto)) {
      await cancelar(btnCancelar.dataset.id);
    }
    return;
  }

  const btnRealizado = e.target.closest(".btn-realizado");
  if (btnRealizado) {
    if (confirm("¿Marcar turno como realizado?")) {
      await marcarRealizado(btnRealizado.dataset.id);
    }
    return;
  }

  const btnBloquear = e.target.closest(".btn-bloquear");
  if (btnBloquear) {
    await bloquear(btnBloquear.dataset.fecha, btnBloquear.dataset.hora);
    return;
  }

  const btnWhatsapp = e.target.closest(".btn-whatsapp");
  if (btnWhatsapp) {
    abrirWhatsAppCliente(
      btnWhatsapp.dataset.tel,
      btnWhatsapp.dataset.nombre,
      btnWhatsapp.dataset.fecha,
      btnWhatsapp.dataset.hora
    );
    return;
  }

  const btnReservar = e.target.closest(".btn-reservar-manual");
  if (btnReservar) {
    const card = btnReservar.closest(".slot-admin");
    const nombre = card.querySelector(".nombre-manual")?.value.trim() || "";
    const telefono = card.querySelector(".tel-manual")?.value.trim() || "";
    const notas = card.querySelector(".nota-manual")?.value.trim() || "";

    await crearManual(
      btnReservar.dataset.fecha,
      btnReservar.dataset.hora,
      nombre,
      telefono,
      notas,
      btnReservar
    );
  }
});

cargarMes();