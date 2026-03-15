const telefonoNegocio="5492914496333";

const horariosBase=[
"09:30",
"11:00",
"14:00",
"15:30"
];

const horarioExtra="17:00";

let turnosOcupados=JSON.parse(localStorage.getItem("turnos"))||{};

const fechaInput=document.getElementById("fecha");
const horariosDiv=document.getElementById("horarios");

fechaInput.addEventListener("change",mostrarHorarios);

function mostrarHorarios(){

horariosDiv.innerHTML="";

let fecha=fechaInput.value;

let dia=new Date(fecha).getDay();

let horarios=[...horariosBase];

if(dia==1||dia==3||dia==5){
horarios.push(horarioExtra);
}

horarios.forEach(h=>{

let key=fecha+"-"+h;

if(!turnosOcupados[key]){

let div=document.createElement("div");

div.className="slot";

div.innerText=h;

div.onclick=()=>seleccionar(h);

horariosDiv.appendChild(div);

}

});

}

let horaSeleccionada="";

function seleccionar(h){

horaSeleccionada=h;

alert("Horario seleccionado: "+h);

}

async function reservarTurno(info){

let nombre = prompt("Ingresá tu nombre");
let telefono = prompt("Ingresá tu teléfono");

let fecha = info.dateStr;

let hora = new Date(info.dateStr).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

let turno = {
nombre: nombre,
telefono: telefono,
fecha: fecha,
hora: hora
};

await addDoc(collection(db,"turnos"), turno);

let mensaje = `Hola Gonzalo, reservé un turno

Nombre: ${nombre}
Teléfono: ${telefono}
Fecha: ${fecha}
Hora: ${hora}`;

window.open(
`https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(mensaje)}`
);

location.reload();

}

import {
collection,
getDocs,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function resetTurnos(){

const snapshot = await getDocs(collection(db,"turnos"));

snapshot.forEach(async (docu)=>{
await deleteDoc(docu.ref);
});

alert("Todos los turnos fueron eliminados");

location.reload();

}
