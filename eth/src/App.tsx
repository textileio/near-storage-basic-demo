import 'regenerator-runtime/runtime';
import { useState, ReactElement, useEffect } from 'react';
import Form from './components/LockForm';
import Welcome from './components/Welcome';
import Upload from "./components/UploadForm";
import { Signer } from "ethers"
import { Status, CoreAPI, Request } from "@textile/eth-storage"

interface Props {
  api: CoreAPI
  wallet: Signer
  address: string
}

const App = ({ wallet, api, address }: Props): ReactElement => {
  const [uploads, setUploads] = useState<Array<Request>>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deposit, setDeposit] = useState<boolean>(false);

  useEffect(() => {
    if (wallet) {
      api.hasDeposit().then(setDeposit)
    }
  }, [wallet, api])

  const onUpload = (file: File) => {
    setUploading(true)
    api.store(file)
      .then((request) => {
        setUploads([...uploads, request])
        setUploading(false)
        alert(`IPFS CID:\n${request.cid["/"]}`)
      })
      .catch((err: Error) => {
        setUploading(false)
        alert(err.message)
      });
  }

  const onStatus = (id: string) => {
    if (id) {
      api.status(id)
        .then(({ request }) => {
          alert(`Filecoin deal status: "${Status[request.status_code]}"!`)
        })
        .catch((err: Error) => alert(err.message));
    } else {
      console.warn("no 'active' file, upload a file first")
    }
  }

  const onSubmit = () => {
    api.addDeposit()
      .then(() => setDeposit(true))
      .catch((err: Error) => alert(err.message));
  };

  return (
    <main>
      <header>
        <h1>Textile Ξthereum Storage Demo</h1>
      </header>
      <p>
        {deposit ? "You got Ξ in here!" : `Deposit some funds, ${address}!`}
      </p>
      {address
        ? (<div>
          <Form onSubmit={onSubmit} />
          {deposit ? <Upload onSubmit={onUpload} inProgress={uploading} /> : null}
          <button type="button" name="release" onClick={(e) => {
            e.preventDefault();
            api.releaseDeposits()
              .then(() => {
                alert("check your wallet in case of released funds")
                // Auto-refresh the page
                window.location.reload();
              })
              .catch((err: Error) => alert(err.message));
          }}>Release
          </button>
          <br />
          {uploads && <h2>Your uploads</h2>}
          {uploads.map((u: Request) => {
            return <p>
              {u.cid["/"]}
              <br />
              <button type="button" name="copy" onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(u.cid["/"])
              }}>
                Copy CID
              </button>
              <button type="button" name="status" onClick={(e) => {
                e.preventDefault();
                onStatus(u.id);
              }}>
                Status
              </button>
              <br />
            </p>
          })}
        </div>
        ) : <Welcome />
      }
    </main>
  );
};

export default App;
