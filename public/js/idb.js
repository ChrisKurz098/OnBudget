//create var to hold db connection 
let db;

// establish a connection to IndexDB database called on_budget and set it to v1.
const request = indexedDB.open('on_budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    //save reference to database
    const db = event.target.result;
    // create an object store (table) called `new_budget_item`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_budget_item', { autoIncrement: true });
};

// upon a successful creation
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save a reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        // we haven't created this yet, but we will soon, so let's comment it out for now
        uploadTransaction();///<----------------------------------------------------------------------------------
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read/write permmisions
    const transaction = db.transaction(['new_budget_item'], 'readwrite');

    //access the object store for 'new_budget_item'
    const TrnsactionObjectStore = transaction.objectStore('new_budget_item');

    //add record to Your store with the add method
    TrnsactionObjectStore.add(record);
    alert('Data stored offline.');

}

function uploadTransaction() {
  console.log('Attempting to upload offline data...');
    //open a new transaction with the database with read/write permmisions
    const transaction = db.transaction(['new_budget_item'], 'readwrite');
    //access the object store for 'new_budget_item'
    const transactionObjectStore = transaction.objectStore('new_budget_item');
    const getAll = transactionObjectStore.getAll();
    // upon a successful .getAll() execution, run this function

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {//<-------------------------------------
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response =>  response.json())
              .then(serverResponse => {
                if (serverResponse.message) throw new Error(serverResponse);
                //new transaction to clear the object store now that data is saved to server
                const transaction = db.transaction(['new_budget_item'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_budget_item');
                //clear all items in store
                transactionObjectStore.clear();
                alert('All offline budget data has be uploaded!');
                location.reload();
              })
              .catch(err => console.log(err));
        }
    }
};

//get ofline data for page reload when offline
function getOfflineTransaction() {
  console.log("GETTING OFFLINE DATA.....");
    //open a new transaction with the database with read/write permmisions
    const transaction = db.transaction(['new_budget_item'], 'readwrite');
    //access the object store for 'new_budget_item'
    const transactionObjectStore = transaction.objectStore('new_budget_item');
    const getAll = transactionObjectStore.getAll();
    // upon a successful .getAll() execution, run this function

    getAll.onsuccess = function () {
      console.log("Result to Return: ", getAll.result)
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
         (getAll.result).map(item => {
           console.log("Pushing...", item)
           transactions.unshift({...item, name: item.name+'*'});
         })
console.log(transactions);
         populateTotal();
         populateTable();
         populateChart();
        }
    }
};


// listen for app coming back online
window.addEventListener('online', uploadTransaction);
