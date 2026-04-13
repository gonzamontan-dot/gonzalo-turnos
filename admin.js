import { db } from "./firebase.js";
import { collection, getDocs, query, where, deleteDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const passwordAdmin = "gonzalo123";
const horariosBase = ["09:30","11:00","14:00","15:30"];
const horarioExtra = "17:00";

const loginWrap = document.getElementById("loginWrap");
const panelWrap = document.getElementById("panelWrap");
const passInput = document.getElementById("pass");
const btnLogin = document.getElementById("btnLogin");
const listaMes = document.getElementById("listaMes");
const agenda = document.getElementById("agenda");
const fechaInput = document.getElementById("fecha");
const btnVerAgenda = document.getElementById("btnVerAgenda");

function parseFechaLocal(fechaStr){
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

btnLogin.addEventListener("click", () => {
  if(passInput.value === passwordAdmin){
    loginWrap.style.display = "none";
    panelWrap.style.display = "flex";
    cargarMes();
  }else{
    alert("Contraseña incorrecta");
  }
});

btnVerAgenda.addEventListener("click", cargarAgenda);

async function cargarMes(){
  listaMes.innerHTML = "Cargando...";

  try{
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const snapshot = await getDocs(collection(db,"turnos"));
    const items = [];

    snapshot.forEach(d => {
      const t = d.data();
      if(!t.fecha) return;
      const [anio, mes] = t.fecha.split("-").map(Number);
      if(anio === anioActual && mes === mesActual){
        items.push({ id: d.id, ...t });
      }
    });

    items.sort((a,b) => (`${a.fecha} ${a.hora}`).localeCompare(`${b.fecha} ${b.hora}`));

    if(items.length === 0){
      listaMes.innerHTML = '<div class="mensaje">No hay turnos cargados este mes</div>';
      return;
    }

    listaMes.innerHTML = "";
    items.forEach(t => {
      const div = document.createElement("div");
      div.className = "mes-item";
      div.innerHTML = `
        <strong>${t.fecha}</strong><br>
        ${t.hora} - ${t.nombre}<br>
        📱 ${t.telefono || "-"}
      `;
      listaMes.appendChild(div);
    });
  }catch(error){
    console.error("Error cargando mes:", error);
    listaMes.innerHTML = '<div class="mensaje error">No se pudieron cargar los turnos del mes</div>';
  }
}

async function cargarAgenda(){
  const fecha = fechaInput.value;
  if(!fecha){
    alert("Elegí una fecha");
    return;
  }

  agenda.innerHTML = '<div class="mensaje">Cargando agenda...</div>';

  const dia = parseFechaLocal(fecha).getDay();
  if(dia === 0 || dia === 6){
    agenda.innerHTML = '<div class="mensaje">No trabajás este día</div>';
    return;
  }

  const horarios = [...horariosBase];
  if([1,3,5].includes(dia)) horarios.push(horarioExtra);

  agenda.innerHTML = "";

  for(const hora of horarios){
    const card = document.createElement("div");

    try{
      const q = query(collection(db,"turnos"), where("fecha","==",fecha), where("hora","==",hora));
      const snapshot = await getDocs(q);

      if(snapshot.empty){
        card.className = "slot-admin libre";
        card.innerHTML = `
          <h3>${hora}</h3>
          <p>Disponible</p>

          <div class="manual">
            <input class="nombre-manual" placeholder="Nombre del cliente" />
            <input class="tel-manual" placeholder="Teléfono del cliente" />

            <div class="acciones">
              <button type="button" class="btn-reservar-manual" data-fecha="${fecha}" data-hora="${hora}">Reservar manual</button>
              <button type="button" class="secondary btn-bloquear" data-fecha="${fecha}" data-hora="${hora}">Bloquear</button>
            </div>
          </div>
        `;
      }else{
        snapshot.forEach(d => {
          const t = d.data();
          card.className = "slot-admin ocupado";
          card.innerHTML = `
            <h3>${hora}</h3>
            <p><strong>${t.nombre}</strong></p>
            <p>📱 ${t.telefono || "-"}</p>

            <div class="acciones">
              <button type="button" class="danger btn-cancelar" data-id="${d.id}">Cancelar</button>
            </div>
          `;
        });
      }
    }catch(error){
      console.error("Error cargando horario:", hora, error);
      card.className = "slot-admin ocupado";
      card.innerHTML = `<h3>${hora}</h3><p>Error al consultar este horario</p>`;
    }

    agenda.appendChild(card);
  }
}

async function bloquear(fecha, hora){
  try{
    const check = query(collection(db,"turnos"), where("fecha","==",fecha), where("hora","==",hora));
    const existente = await getDocs(check);
    if(!existente.empty){
      alert("Ese horario ya está ocupado o bloqueado");
      await cargarAgenda();
      return;
    }

    await addDoc(collection(db,"turnos"), {
      nombre:"Bloqueado",
      telefono:"-",
      fecha,
      hora,
      creadoEn:new Date().toISOString()
    });

    alert("Horario bloqueado");
    await cargarAgenda();
    await cargarMes();
  }catch(error){
    console.error("Error bloqueando:", error);
    alert("No se pudo bloquear el horario");
  }
}

async function cancelar(id){
  try{
    await deleteDoc(doc(db,"turnos",id));
    alert("Turno cancelado");
    await cargarAgenda();
    await cargarMes();
  }catch(error){
    console.error("Error cancelando:", error);
    alert("No se pudo cancelar el turno");
  }
}

async function crearManual(fecha, hora, nombre, telefono, boton){
  if(!nombre){
    alert("Escribí el nombre del cliente");
    return;
  }

  boton.disabled = true;
  boton.textContent = "Guardando...";

  try{
    const check = query(collection(db,"turnos"), where("fecha","==",fecha), where("hora","==",hora));
    const existente = await getDocs(check);

    if(!existente.empty){
      alert("Ese horario ya está ocupado");
      await cargarAgenda();
      return;
    }

    await addDoc(collection(db,"turnos"), {
      nombre,
      telefono,
      fecha,
      hora,
      creadoEn:new Date().toISOString()
    });

    alert("Turno creado correctamente");
    await cargarAgenda();
    await cargarMes();
  }catch(error){
    console.error("Error creando manual:", error);
    alert("No se pudo crear el turno");
  } finally {
    boton.disabled = false;
    boton.textContent = "Reservar manual";
  }
}

agenda.addEventListener("click", async (e) => {
  const btnCancelar = e.target.closest(".btn-cancelar");
  if(btnCancelar){
    if(confirm("¿Cancelar turno?")){
      await cancelar(btnCancelar.dataset.id);
    }
    return;
  }

  const btnBloquear = e.target.closest(".btn-bloquear");
  if(btnBloquear){
    await bloquear(btnBloquear.dataset.fecha, btnBloquear.dataset.hora);
    return;
  }

  const btnReservar = e.target.closest(".btn-reservar-manual");
  if(btnReservar){
    const card = btnReservar.closest(".slot-admin");
    const nombre = card.querySelector(".nombre-manual")?.value.trim() || "";
    const telefono = card.querySelector(".tel-manual")?.value.trim() || "";
    await crearManual(btnReservar.dataset.fecha, btnReservar.dataset.hora, nombre, telefono, btnReservar);
  }
});

cargarMes();
