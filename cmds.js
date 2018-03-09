const {models} = require('./model');

const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require ("./out");

/**
 * Muestra la ayuda.
 */
exports.helpCmd = rl => {
 	log("Comandos:");
 	log("  h|help - Muestra esta ayuda.");
 	log("  list - Listar los quizzes existentes.");
 	log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
 	log("  add - Añadir un nuevo quiz interactivamente.");
 	log("  delete <id> - Borrar el quiz indicado.");
 	log("  edit <id> - Editar el quiz indicado.");
 	log("  test <id> - Probar el quiz indicado.");
 	log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
 	log("  credits - Créditos.");
 	log("  q|quit - Salir del programa.");
 	rl.prompt();
 };

/**
 * Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd = rl => {
	
	models.quiz.findAll()	//PROMESA que me devolverá todos los quizzes existentes
	.each(quiz=> {	//Toma como parám. los quizzes que me devuelve findAll().
			log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});

};

/** 
 * Esta función devuelve una promesa que:
 *	- Valida que se ha introducido un valor para el parámetro.
 *	- Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa satisface y devuelve el valor de id a usuario.
 * @param	id Parametro con el índice a valiar.
 */
 const validateId = id =>{

 	return new Sequelize.Promise((resolve, reject) => {
 		if (typeof id === "undefined") {
 			reject(new Error(`Falta el parametro <id>.`));
 		} else {
	 		id = parseInt(id);	//coger la parte entera y descartar lo demás
	 		if (Number.isNaN(id)) {
	 			reject(new Error(`El valor del parámetro <id> no es un número.`));
	 		} else {
	 			resolve(id);
	 		}
	 	}
 	});
 }

/**
 * Muestra el quizz indicado en el parámetro: la pregunta y la respuesta
 *
 * @param rl Objeto readline usado para implementar el CLI
 *@param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))	//si se cumple la promesa, no hay un error, si no iría al catch
	//A su vez, el findById es otra promesa y, una vez ha terminado paso al siguiente then.
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
 *
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido.
 * Entonces, la llamada a then que hay que hacer a la promesa devuelta será
 * 		.then(answer=>{...})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio y al final
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta qué hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompr hay que sacarlo cuando ya se ha terminado la interaccion con el usuario,
 * es decir, la llamada al rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question
 *
 * @param rl Objeto readline usado para implementar el CLI
 */
exports.addCmd = rl => {
	
	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca la respuesta: ')
		.then(a =>{
			return {question : q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl,id) => {
	
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
 * Edita un quiz del modelo.
 *
 * @param, id Clave del quiz a editar.
 */
exports.editCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id={id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);	
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erróneo.');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
 * Prueba un quiz, es decir, hace una pregunta a la uqe debemos contestar.
 *
 * @param, id Clave del quiz a probar.
 */
exports.testCmd = (rl,id) => {
	validateId(id)
	.then( id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id={id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, quiz.question)
		.then(q => {
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				if (a.trim().toLowerCase() === quiz.answer.toLowerCase()){
					log(`Su respuesta es correcta.`);
					biglog('CORRECTA.', 'green');
				}
				else {
					log(`Su respuesta es incorrecta.`);
					biglog('INCORRECTA.', 'red');
				}
			})
			.catch(error => {
				errorlog(error.message);
			})
			.then(() => {
				rl.prompt();
			});
		});
	});
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 */
exports.playCmd = rl => {
	let score = 0;

	let toBePlayed = [];
	
	const playOne = () =>{

		//Otra forma de hacerlo:
		//return Promise.resolve()
		//.then() => {	})

		return new Promise((resolve, reject) => {

			if(toBePlayed.length <= 0) {
			log(`No hay nada más que preguntar`);
			log(`Fin del juego. Aciertos: ${score}`);
			biglog(score, 'magenta');
			resolve();//Saber cómo acabado la promesa e ir a los .then o a los .catch
			return;
			}

			let pos = Math.floor(Math.random() * teBePlayed.length); //posición del array, que es el quiz que vpy a preguntar.
			let quiz= toBePLayed[pos];	//Saco el quiz de la posicion pos aletaria.
			toBePLayed.splice(pos,1); 	//borro el quiz de la posición pos.

			makeQuestion(rl, quiz.question)	//Promesa 	No hago return porque me da igual lo que devuelva esta promesa
			.then(answer => {
				if (answer.trim().toLowerCase() === quiz.answer.toLowerCase().trim()) {
					score++;
					log(`CORRECTO - Lleva ${score} aciertos`);
					resolve(playOne());
				}else{
					log(`INCORRECTO.`);
					log(`Fin del juego. Aciertos: ${score}`);
					biglog(score, 'magenta');
					resolve();
				}
			});
		});
	};

	models.quiz.findAll({raw: true}) //todas las preguntas de la BD. con el raw, quitamos info. (mirar documentación)
	.then(quizzes => {	//Igual que funcion con parámetro quizzes
		toBePlayed = quizzes;
	})
	.then (() => {
		return playOne(); //Para que no acabe hasta que acabe esta segunda promesa(playOne). Tenemos que hacer que sea una promesa.
	})
	.catch(error => {
		log(`Error: + error`);
	})
	.then(() => {
		log(`Fin del juego. Aciertos: ${score}`);
		biglog(score, 'magenta');
		rl.prompt();
	});

};


/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = rl => {
	log('Autores de la práctica:');
	log('SUSANA Fernández Redondo.', 'green');
	rl.prompt();
};


/**s
 * Terminar el programa
 */
exports.quitCmd = rl => {
	rl.close();
};
