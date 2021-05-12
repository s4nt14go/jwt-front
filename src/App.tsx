import React, {useRef, useState} from 'react';
import './App.css';
import Header from "./components/Header";
import styles from "./App.module.css";
import { useFormFields } from "./libs/hooks";
import config from './config';
import Notification, {Severity} from "./components/Notification";

function App() {

  const [fields, handleFieldChange] = useFormFields({
    account: '',
    textarea: '',
    token: '',
  });
  const [includeToken, setIncludeToken] = useState(false);
  function toggleIncludeToken() {
    setIncludeToken(!includeToken);
  }
  const NotificationRef = useRef<any>();
  function create() {
    fetch(`${config.API_URL}/create-account`, {
      method: 'POST',
      body: JSON.stringify({
        account: fields.account
      }),
    })
      .then(response => {
        console.log('response', response);
        return response.json();
      })
      .then(data => {
        console.log('Resolved:', data);
        if (data.error) return NotificationRef.current.start(data.error, Severity.ERROR);
        NotificationRef.current.start(data, Severity.SUCCESS);
      })
      .catch((error) => {
        console.log('Rejected:', error);
        NotificationRef.current.start(error.toString(), Severity.ERROR);
      });
  }
  function get() {
    fetch(`${config.API_URL}/get-token`, {
      method: 'POST',
      body: JSON.stringify({
        account: fields.account
      }),
    })
      .then(response => {
        console.log('response', response);
        return response.json();
      })
      .then(data => {
        console.log('Resolved:', data);
        if (data.error) return NotificationRef.current.start(data.error, Severity.ERROR);
        NotificationRef.current.start(`Token for "${fields.account}" retrieved successfully`, Severity.SUCCESS);
        handleFieldChange({target: {id: 'token', value: data}});
      })
      .catch((error) => {
        console.log('Rejected:', error);
        NotificationRef.current.start(error.toString(), Severity.ERROR);
      });
  }

  let cancelPromise = false;
  function read() {
    handleFieldChange({target: {id: 'textarea', value: ''}});
    cancelPromise = false;
    fetch(`${config.API_URL}/read-account`, {
      method: 'GET',
      headers: {
        Authorization: includeToken? `Bearer ${fields.token}` : '',
      },
    })
      .then(response => {
        console.log('response', response);
        if (response.status === 401) {
          NotificationRef.current.start(`Unauthorized: token is invalid or has expired${!includeToken? " - also take into account you didn't use the checkbox to include it in header :)": ''}`, Severity.ERROR);
          cancelPromise = true;
        }
        return response.json();
      }).then(data => {
        if (cancelPromise) return console.log('promise cancelled');
        console.log('Resolved:', data);
        if (data.error) return NotificationRef.current.start(data.error, Severity.ERROR);
        handleFieldChange({target: {id: 'textarea', value: JSON.stringify(data, null, 2)}});
      })
      .catch((error) => {
        console.log('Rejected:', error);
        NotificationRef.current.start(error.toString(), Severity.ERROR);
      });
  }

  function update() {
    let data;
    try {
      data = JSON.parse(fields.textarea);
      delete data.account;
    } catch (e) {
      console.log('e', e);
      return NotificationRef.current.start('Invalid JSON', Severity.ERROR);
    }
    cancelPromise = false;
    fetch(`${config.API_URL}/update-account`, {
      method: 'POST',
      headers: {
        Authorization: includeToken? `Bearer ${fields.token}` : '',
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        console.log('response', response);
        if (response.status === 401) {
          NotificationRef.current.start(`Unauthorized: token is invalid or has expired${!includeToken? " - also take into account you didn't use the checkbox to include it in header :)": ''}`, Severity.ERROR);
          cancelPromise = true;
        }
        return response.json();
      })
      .then(data => {
        if (cancelPromise) return console.log('promise cancelled');
        console.log('Resolved:', data);
        if (data.error) return NotificationRef.current.start(data.error, Severity.ERROR);
        NotificationRef.current.start(data, Severity.SUCCESS);
      })
      .catch((error) => {
        console.log('Rejected:', error);
        NotificationRef.current.start(error.toString(), Severity.ERROR);
      });
  }

  return (
    <div className="App">
      <div className="container px-5 pb-12 mx-auto">

      <Header />

      <section className="text-gray-600 body-font md:w-5/6 mx-auto">

        <div className="container px-5 mx-auto">

          <div
            className="flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end">

            <div className="relative flex-grow w-full">
              <label htmlFor="account" className="leading-7 text-sm text-gray-600">Account</label>
              <input type="text" id="account" name="account" value={fields.account} onChange={handleFieldChange}
                     className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
            </div>
            <button onClick={create}
              className="w-full sm:w-auto text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">Create
            </button>
          </div>

          <hr className={`${styles.hr1} my-6`}/>

          <div
            className="flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end">
            <button onClick={get}
              className="w-full sm:w-auto whitespace-nowrap text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">Get Token
            </button>
            <div className="relative flex-grow w-full">
              <label htmlFor="token" className="leading-7 text-sm text-gray-600">Token</label>
              <input type="text" id="token" name="token" value={fields.token} onChange={handleFieldChange}
                     className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
            </div>
          </div>

          <div className='mt-12 text-left'>
            <div className="flex items-center">
              <input type="checkbox" checked={includeToken} onChange={toggleIncludeToken} disabled={!fields.token} className="h-4 w-4 text-gray-700 border rounded mr-2" />
              <label htmlFor="token-checkbox">Include token in Authorization Header</label>
            </div>
            <button onClick={read}
              className="w-full sm:w-auto mt-3 whitespace-nowrap text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">Read Account
            </button>
            <button onClick={update}
              className="w-full sm:w-auto sm:ml-5 mt-3 whitespace-nowrap text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg">Update
            </button>

            <textarea value={fields.textarea} id="textarea" onChange={handleFieldChange} className="mt-3 w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                      rows={6} />

          </div>


        </div>

      </section>
      </div>

      <Notification ref={NotificationRef} />
    </div>
  );
}

export default App;
