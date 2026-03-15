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

mostrarHorarios();

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

function reservar(){

let nombre=document.getElementById("nombre").value;

let telefono=document.getElementById("telefono").value;

let fecha=fechaInput.value;

let key=fecha+"-"+horaSeleccionada;

turnosOcupados[key]=true;

localStorage.setItem("turnos",JSON.stringify(turnosOcupados));

let mensaje=`Hola Gonzalo quiero reservar turno

Nombre: ${nombre}
Teléfono: ${telefono}
Fecha: ${fecha}
Hora: ${horaSeleccionada}`;

let url=`https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(mensaje)}`;

window.open(url);

mostrarHorarios();

}
