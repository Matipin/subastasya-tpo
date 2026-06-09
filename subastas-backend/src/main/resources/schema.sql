SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS registroDeSubasta;
DROP TABLE IF EXISTS pujos;
DROP TABLE IF EXISTS asistentes;
DROP TABLE IF EXISTS itemsCatalogo;
DROP TABLE IF EXISTS catalogos;
DROP TABLE IF EXISTS fotos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS subastas;
DROP TABLE IF EXISTS subastadores;
DROP TABLE IF EXISTS duenios;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS seguros;
DROP TABLE IF EXISTS sectores;
DROP TABLE IF EXISTS empleados;
DROP TABLE IF EXISTS personas;
DROP TABLE IF EXISTS paises;
DROP TABLE IF EXISTS medio_de_pago;

create table paises(
	numero bigint not null,
	nombre varchar(250) not null,
	nombreCorto varchar(250) null,
	capital varchar(250) not null,
	nacionalidad varchar(250) not null,
	idiomas varchar(150) not null,
	constraint pk_paises primary key (numero)
);

create table personas(
	identificador bigint not null AUTO_INCREMENT,
	documento varchar(20) not null,
	nombre varchar(150) not null,
	direccion varchar(250),
	estado varchar(15),
	foto LONGBLOB,
	constraint pk_personas primary key (identificador),
	constraint chkEstado check (estado in ('activo', 'incativo'))
);

create table empleados(
	identificador bigint not null,
	cargo varchar(100),
	sector bigint null,
	constraint pk_empleados primary key (identificador)
);

create table sectores(
	identificador bigint not null AUTO_INCREMENT,
	nombreSector varchar(150) not null,
	codigoSector varchar(10) null,
	responsableSector bigint null,
	constraint pk_sectores primary key (identificador),
	constraint fk_sectores_empleados foreign key (responsableSector) references empleados(identificador)
);

create table seguros(
	nroPoliza varchar(30) not null,
	compania varchar(150) not null,
	polizaCombinada varchar(2),
	importe decimal(18,2) not null,
	constraint pk_seguro primary key (nroPoliza),
	constraint chkpolizaCombinada check(polizaCombinada in ('si','no')),
	constraint chkImporte check (importe > 0)
);

create table clientes(
	identificador bigint not null,
	numeroPais bigint null,
	admitido varchar(2),
	categoria varchar(10),
	verificador bigint null,
	constraint pk_clientes primary key (identificador),
	constraint fk_clientes_personas foreign key (identificador) references personas(identificador),
	constraint fk_clientes_empleados foreign key (verificador) references empleados (identificador),
	constraint fk_clientes_paises foreign key (numeroPais) references paises (numero),
	constraint chkAdmitido check(admitido in ('si','no')),
	constraint chkCategoria check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino'))
);

create table duenios(
	identificador bigint not null,
	numeroPais bigint null,
	verificacionFinanciera varchar(2),
	verificacionJudicial varchar(2),
	calificacionRiesgo int,
	verificador bigint null,
	constraint pk_duenios primary key (identificador),
	constraint fk_duenios_personas foreign key (identificador) references personas(identificador),
	constraint fk_duenios_empleados foreign key (verificador) references empleados (identificador),
	constraint chkVF check(verificacionFinanciera in ('si','no')),
	constraint chkVJ check(verificacionJudicial in ('si','no')),
	constraint chkCR check(calificacionRiesgo in (1,2,3,4,5,6))
);

create table subastadores(
	identificador bigint not null,
	matricula varchar(15),
	region varchar(50),
	constraint pk_subastadores primary key (identificador),
	constraint fk_subastadores_personas foreign key (identificador) references personas(identificador)
);

create table subastas(
	identificador bigint not null AUTO_INCREMENT,
	fecha date, 
	hora time not null,
	estado varchar(10),
	subastador bigint null,
	ubicacion varchar(350) null,
	capacidadAsistentes int null,
	tieneDeposito varchar(2),
	seguridadPropia varchar(2),
	categoria varchar(10),
	constraint pk_subastas primary key (identificador),
	constraint fk_subastas_subastadores foreign key (subastador) references subastadores(identificador),
	constraint chkES check (estado in ('abierta','cerrada')),
	constraint chkTD check(tieneDeposito in ('si','no')),
	constraint chkSP check(seguridadPropia in ('si','no')),
	constraint chkCS check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino'))
);

create table productos(
	identificador bigint not null AUTO_INCREMENT,
	fecha date,
	disponible varchar(2),
	descripcionCatalogo varchar(500) null default 'No Posee',
	descripcionCompleta varchar(300) not null,
	revisor bigint not null,
	duenio bigint not null,
	seguro varchar(30) null,  
	constraint pk_productos primary key (identificador),
	constraint fk_productos_empleados foreign key (revisor) references empleados(identificador),
	constraint fk_productos_duenios foreign key (duenio) references duenios(identificador),
	constraint chkD check (disponible in ('si','no'))
);

create table fotos(
	identificador bigint not null AUTO_INCREMENT,
	producto bigint not null,
	foto LONGBLOB not null,
	constraint pk_fotos primary key (identificador),
	constraint fk_fotos_productos foreign key (producto) references productos(identificador)
);

create table catalogos(
	identificador bigint not null AUTO_INCREMENT,
	descripcion varchar(250) not null,
	subasta bigint null,
	responsable bigint not null,
	constraint pk_catalogos primary key (identificador),
	constraint fk_catalogos_empleados foreign key (responsable) references empleados(identificador),
	constraint fk_catalogos_subastas foreign key (subasta) references subastas(identificador)
);

create table itemsCatalogo(
	identificador bigint not null AUTO_INCREMENT,
	catalogo bigint not null,
	producto bigint not null,
	precioBase decimal(18,2) not null,
	comision decimal(18,2) not null,
	subastado varchar(2),
	constraint pk_itemsCatalogo primary key (identificador),
	constraint fk_itemsCatalogo_catalogos foreign key (catalogo) references catalogos(identificador),
	constraint fk_itemsCatalogo_productos foreign key (producto) references productos(identificador),
	constraint chkPB check (precioBase > 0.01),
	constraint chkC check (comision > 0.01),
	constraint chkS check (subastado in ('si','no'))
);

create table asistentes(
	identificador bigint not null AUTO_INCREMENT,
	numeroPostor int not null,
	cliente bigint not null,
	subasta bigint not null,
	constraint pk_asistentes primary key (identificador),
	constraint fk_asistentes_clientes foreign key (cliente) references clientes(identificador),
	constraint fk_asistentes_subasta foreign key (subasta) references subastas(identificador)
);

create table pujos(
	identificador bigint not null AUTO_INCREMENT,
	asistente bigint not null,
	item bigint not null,
	importe decimal(18,2) not null,
	ganador varchar(2) default 'no',
	constraint pk_pujos primary key (identificador),
	constraint fk_pujos_asistentes foreign key (asistente) references asistentes(identificador),
	constraint fk_pujos_itemsCatalogo foreign key (item) references itemsCatalogo(identificador),
	constraint chkI check (importe > 0.01),
	constraint chkG check (ganador in ('si','no'))
);

create table registroDeSubasta(
	identificador bigint not null AUTO_INCREMENT,
	subasta bigint not null,
	duenio bigint not null,
	producto bigint not null,
	cliente bigint not null,
	importe decimal(18,2) not null,
	comision decimal(18,2) not null,
	constraint pk_registroDeSubasta primary key (identificador),
	constraint fk_registroDeSubasta_subastas foreign key (subasta) references subastas(identificador),
	constraint fk_registroDeSubasta_duenios foreign key (duenio) references duenios(identificador),
	constraint fk_registroDeSubasta_producto foreign key (producto) references productos(identificador),
	constraint fk_registroDeSubasta_cliente foreign key (cliente) references clientes(identificador),
	constraint chkImportePagado check (importe > 0.01),
	constraint chkComisionPagada check (comision > 0.01)
);
SET FOREIGN_KEY_CHECKS=1;
