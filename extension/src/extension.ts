import * as vscode from "vscode";
import { WebSocket } from "ws";

export function activate(context: vscode.ExtensionContext) {

  const WS_ADDRESS = process.env.WS_SERVER_ADDRESS ?? "ws://lin-res128.csc.ncsu.edu:3030"
  const ws = new WebSocket(WS_ADDRESS);
  const config = vscode.workspace.getConfiguration("files");

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "pptWebView",
      new PPTWebViewProvider(context.extensionUri, ws, (status) => {
        console.log("Updating current status to ", status);
        if (status === "navigator") {
          // Make the current editor read-only
          vscode.commands.executeCommand(
            "workbench.action.files.setActiveEditorReadonlyInSession"
          );
          vscode.window
            .showInformationMessage(
              "You are now the navigator.",
              "Switch to Driver"
            )
            .then((action) => {
              if (action === "Switch to Driver") {
                console.log("Requesting a switch to driver...");
                ws.send(JSON.stringify({ action: "switch" }));
              }
            });
        } else {
          // Remove the read-only flag on the current editor
          vscode.commands.executeCommand(
            "workbench.action.files.resetActiveEditorReadonlyInSession"
          );
          vscode.window.showInformationMessage("You are now the driver.");
        }
      }),
      {}
    )
  );
  console.log("Extension activated");
}

class PPTWebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "pptWebView";

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private websocket: WebSocket,
    private updateStatus: (arg0: "driver" | "navigator") => void
  ) {
    this.wsReceive();
  }

  private uid: string | undefined = undefined;
  private partnerUid: string | undefined = undefined;
  private wsReady = false;
  private status: "driver" | "navigator" | null = null;

  private wsSend(data: any) {
    if (data.action === "hello") {
      this.wsReady = true;
    } else if (!this.wsReady) {
      throw new Error("Can't send ordinary message until hello has been sent");
    }
    console.log("Sending to server: ", data);
    this.websocket.send(JSON.stringify({ ...data, source: "vsc-extension" }));
  }

  private wsReceive() {
    this.websocket.on("open", () => {
      console.log("WS Connection opened");
    });
    this.websocket.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log("Received from server", msg);
      if (msg.action === "start" || msg.action === "switch") {
        this.status = msg.status;
        this.updateStatus(this.status!);
      }
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.onDidReceiveMessage((data) => {
      console.log("[in extension] Received message: ", data);
      if (data.message === "id" && !this.wsReady) {
        this.uid = data.uid;
        this.partnerUid = data.partnerUid;
        this.wsSend({
          action: "hello",
          uid: this.uid,
          partnerUid: this.partnerUid,
        });
        vscode.window.showInformationMessage(
          "Connected to the server.\n\nYour ID: " +
            this.uid +
            "\nYour partner's ID: " +
            this.partnerUid
        );
      }
    });

    webviewView.webview.html = `<!DOCTYPE html>
								<html lang="en">
									<body style="display:flex;justify-content:center;align-items:center;margin:0;padding:0;">
										<iframe id="ppt-frame" src="http://127.0.0.1:3000" style="width:100vw;height:100vh;border:none;"></iframe>
                    <script type="text/javascript">
                      const iframe = document.getElementById("ppt-frame");
                      
                      const vscode = acquireVsCodeApi();

                      window.addEventListener("message", (e) => {
                        console.log("[vscode extension iframe] Message received!", e);
                        // Pass the message along to the VSCode extension
                        vscode.postMessage(e.data);
                      });
                      window.postMessage("hi", "*");
                    </script>
									</body>
								</html>`;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
