import { useEffect, useState } from "react";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import RPC from "./tezosRPC";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css"; 

const clientId = "BLBNWswqgg8drweTanr7Hh43nRQwD5gTK4ieF4bOaWsoJdCVqnydwieDE6kAVrgL9oieQQ-Fs05RI4K-GnTWPu8";

function App() {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any[]>([]);
  const [tezosKeyPair, setTezosKeyPair] = useState<any[]>([]);
  const [userAccounts, setUserAccounts] = useState<string[]>([]);
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.OTHER,
          chainId: "0x1",
          rpcTarget: "https://rpc.tzbeta.net/",
          displayName: "Tezos",
          blockExplorer: "https://tzstats.com",
          ticker: "XTZ",
          tickerName: "Tezos",
        };
        const web3authInstance = new Web3AuthNoModal({
          clientId,
          chainConfig,
          web3AuthNetwork: "sapphire_devnet",
        });

        const privateKeyProvider = new CommonPrivateKeyProvider({
          config: { chainConfig },
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            clientId:
              "BLBNWswqgg8drweTanr7Hh43nRQwD5gTK4ieF4bOaWsoJdCVqnydwieDE6kAVrgL9oieQQ-Fs05RI4K-GnTWPu8", //Optional - Provide only if you haven't provided it in the Web3Auth Instantiation Code
            uxMode: "popup",
            loginConfig: {
              jwt: {
                verifier: "345-tesdt",
                typeOfLogin: "jwt",
                clientId: "64qOEG8JGyQd5h9NMOxnIYOOg9KIxdh2",
              },
            },
          },
          privateKeyProvider,
        });
        web3authInstance.configureAdapter(openloginAdapter);
        setWeb3auth(web3authInstance);

        await web3authInstance.init();
        setProvider(web3authInstance.provider);
        if (web3authInstance.connectedAdapterName) {
          setLoggedIn(true);
          const userInfo = await web3authInstance.getUserInfo();
          setUser([userInfo]);

          console.log(`Name: ${userInfo.name}`);
          console.log(`Email: ${userInfo.email}`);
          console.log(`Profile Image: ${userInfo.profileImage}`);

          
          // Load additional data
          const rpc = new RPC(web3authInstance.provider as IProvider);
          const tezosKey = await rpc.getTezosKeyPair();
          setTezosKeyPair(tezosKey);

          const userAccount = await rpc.getAccounts();
          setUserAccounts(userAccount);

          const blockNumber = await rpc.getCurrentBlockNumber();
          setCurrentBlockNumber(blockNumber);

          setLoading(false); // Set loading to false after data is loaded

        }
      } catch (error) {
        console.error(error);
        setLoading(false); // Set loading to false in case of an error

      }
    };

    init();
  }, []);

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }

    // Define your custom login options
    const customLoginOptions = {
      domain: "https://dev-4asx36bqgfm61bfz.us.auth0.com", // Auth0 Domain
      verifierIdField: "sub", // Field name of the `sub` field in the JWT
      connection: "windowslive", // Auth0 connection name
    };

    try {
      // Connect to the custom login provider (jwt)
      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: "jwt",
          extraLoginOptions: customLoginOptions,
        }
      );

      // Set the provider and update login state
      setProvider(web3authProvider);
      setLoggedIn(true);

      // Call getUserInfo immediately after logging in
      const userInfo = await web3auth.getUserInfo();
      setUser([userInfo]);

      console.log(`Name: ${userInfo.name}`);
      console.log(`Email: ${userInfo.email}`);
      console.log(`Profile Image: ${userInfo.profileImage}`);
    } catch (error) {
      console.error("Error during custom login:", error);
      uiConsole("Failed to log in using custom provider");
    }
  };


  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };

  const loggedInView = (
    <div className="row">
      {loggedIn && user[0] && (
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header bg-primary text-white">User Profile</div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-auto">
                  <img
                    src={user[0].profileImage}
                    alt="Profile"
                    className="img-fluid rounded-circle"
                    style={{ maxWidth: "100px" }}
                  />
                </div>
                <div className="col">
                  <p>
                    <strong>Name:</strong> {user[0].name}
                  </p>
                  <p>
                    <strong>Email:</strong> {user[0].email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="col-md-6">
        <div className="row">
          <div className="col-md-12 mb-3">
            <h4>Tezos Key Pair</h4>
            <pre>{JSON.stringify(tezosKeyPair, null, 2)}</pre>
          </div>
          <div className="col-md-12 mb-3">
            <h4>User Accounts</h4>
            <pre>{JSON.stringify(userAccounts, null, 2)}</pre>
          </div>
          <div className="col-md-12 mb-3">
            <h4>Current Block Number</h4>
            <p>{`Current Block Number: ${currentBlockNumber}`}</p>
          </div>
          <div className="col-md-12">
            <button onClick={logout} className="btn btn-danger btn-block">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  const unloggedInView = (
    <div className="text-center">
      <button onClick={login} className="btn btn-primary">
        Login
      </button>
    </div>
  );

  return (
    <div className="container mt-4">
{loading ? (
  <p>Loading...</p>
) : (
      <main>
        {loggedIn ? loggedInView : unloggedInView}

        <div id="console" className="console bg-light p-3 mb-4">
          <p className="m-0">Logged in Successfully!</p>
        </div>
      </main>
      )}
      <footer className="text-center text-muted mt-4">
        <small>Made with ❤️ by Allen</small>
      </footer>
    </div>
  );
}

export default App;