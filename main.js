 	 
const readline = require('readline');

const cmds = require("./cmds");

const net = require("net");

const {log, biglog, errorlog, colorize} = require ("./out");

//Tabla con todos los comandos, no la uso
const commands = {
	'help': cmds.helpCmd,
	'h': cmds.helpCmd,
	'quit': cmds.quitCmd,
	'q': cmds.quitCmd,
	'add': cmds.addCmd,
	'list': cmds.listCmd,
	'show': cmds.showCmd,
	'test': cmds.testCmd,
	'play': cmds.playCmd,
	'p': cmds.playCmd,
	'delete': cmds.deleteCmd,
	'edit': cmds.editCmd,
	'credits': cmds.creditsCmd,
};

//Crear el socket del servidor
net.createServer(socket =>{

	console.log("Se ha conectado un cliente desde" + socket.remoteAddress);

	//Mensaje inicial
	biglog(socket, 'CORE Quiz', 'green'); 

	const rl = readline.createInterface({
		input: socket,
		output: socket,
		prompt: colorize("quiz> ", 'blue'),
		completer: (line)=> {
			const completions = 'h help add delete edit list p play credits q quit'.split(' ');
			const hits = completions.filter((c) => c.startsWith(line));
			//show all completions if none found
			return [hits.length ? hits : completions, line];
		}
	});
 
	socket
	.on("error", () => {rl.close(); })
	.on("end", () => {rl.close(); })
	rl.prompt();
 
	rl
	.on('line', (line) => {

		let args = line.split(" ");
		let cmd = args[0].toLowerCase().trim();

		//if... cada caso
	

		switch (cmd) {
		  	case '':
		  		rl.prompt();
		  		break;
		  	
		  	case 'h':
		  	case 'help':
		  		cmds.helpCmd(rl,socket); 
		  		break;
			
			case 'quit':
			case 'q':
				break;

			case 'add':
				cmds.addCmd(socket, rl);
				break;

			case 'list':
				cmds.listCmd(socket, rl);
				break;

			case 'show':
				cmds.showCmd(socket, rl, args[1]);
				break;

			case 'test':
				cmds.testCmd(socket, rl, args[1]);
				break;

			case 'play':
			case 'p':
				cmds.playCmd(socket, rl);
				break;

			case 'delete':
				cmds.deleteCmd(socket, rl, args[1]);
				break;

			case 'edit':
				cmds.editCmd(socket, rl, args[1]);
				break;		

		    case 'credits':
		      	cmds.creditsCmd(rl,socket);
		      	break;

		    default:
		      log(socket, `Comando desconocido:  '${colorize(cmd, 'red')}'`);
		      log(socket, `Use ${colorize('help', 'green')} para ver todos los comandos disopnibles.`);
		      rl.prompt();
		      break;
		}
	})
	.on('close', () => {
	  	log(socket,'Adiós!');
	  	socket.end();
	  	//process.exit(0);
	});

})
.listen(3030);





