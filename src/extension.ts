'use strict';

// Imports /////////////////////////////////////////////////////////////////////

import * as path from "path";
import * as net from "net";
import * as vscode from "vscode";

// Functions ///////////////////////////////////////////////////////////////////

function send( realm: string, client?: string ): void {

	// Parameter Defaults //

	if ( client == null ) client = "";

	// Common //

	const config = vscode.workspace.getConfiguration( "gmod-luadev" )
	const document = vscode.window.activeTextEditor.document;

	// Document Title //

	const document_title =
		config.get( "hidescriptname", false )
			? "_"
			: path.basename( document.uri.fsPath );

	// Open Socket //

	const socket = new net.Socket();
	socket.connect( config.get( "port", 27099 ) );
	socket.write(
		realm + "\n" +
		document_title + "\n" +
		client + "\n" +
		document.getText()
	);
	socket.on( "error", ( ex ) => {
		if ( ex.code == "ECONNREFUSED" )
			vscode.window.showErrorMessage(
				"Could not connect to LuaDev!" );
		else
			vscode.window.showErrorMessage( ex.message );
	});
	socket.end();

}

function getPlayerList(): void {

	const config = vscode.workspace.getConfiguration( "gmod-luadev" )

	const socket = new net.Socket();
	socket.connect( config.get( "port", 27099 ) );
	socket.write( "requestPlayers\n" );
	socket.setEncoding( "utf8" );
	socket.on( "data", function ( data: string ): void {

		const clients = data.split( "\n" );
		clients.sort();

		vscode.window.showQuickPick(
			clients,
			{
				placeHolder: "Select Client to send to"
			}
		).then( function ( client: string ): void {
			// Dialogue cancelled
			if ( client == null ) return;
			// Send to client
			send( "client", client );
		});

	});

}

// Exports /////////////////////////////////////////////////////////////////////

export function activate( context: vscode.ExtensionContext ): void {

	const command = vscode.commands.registerCommand;

	context.subscriptions.push(
		command( "gmod-luadev.server", () => send( "sv" ) ),
		command( "gmod-luadev.shared", () => send( "sh" ) ),
		command( "gmod-luadev.clients", () => send( "cl" ) ),
		command( "gmod-luadev.self", () => send( "self" ) ),
		command( "gmod-luadev.client", getPlayerList )
	);

}
