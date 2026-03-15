import { db } from "./firebase.js";

import {
collection,
getDocs,
addDoc,
query,
where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const telefonoNegocio="5492914496333";

const horariosBase=[
"09:30",
"11:00",
"14:00",
"15:30"
];

const horarioExtra="17:00";

const fechaInput=document.getElementById("fecha");
const horariosDiv=document.getElementById("horarios");

let horaSeleccionada="";

fechaInput.addEventListener("change",mostrarHorarios);

async function mostrarHorarios(){

horariosDiv.innerHTML="";

let fecha=fechaInput.value;

if(!fecha) return;

let dia=new Date(fecha+"T00:00").getDay();

if(dia===0 || dia===6){

horariosDiv.innerHTML="No hay turnos disponibles este día";

return;

}

let horarios=[...horariosBase];

if(dia===1 || dia===3 || dia===5){

horarios.push(horarioExtra);

}

for(let h of horarios){

let ocupado=false;

const q=query(
collection(db,"turnos"),
where("fecha","==",fecha),
where("hora","==",h)
);

const snapshot=await getDocs(q);

if(!snapshot.empty){
ocupado=true;
}

if(!ocupado){

let div=document.createElement("div");

div.className="slot";

div.innerText=h;

div.onclick=()=>seleccionar(h);

horariosDiv.appendChild(div);

}

}

}

function seleccionar(h){

horaSeleccionada=h;

alert("Horario seleccionado: "+h);

}

window.reservar = async function(){

let nombre=document.getElementById("n
