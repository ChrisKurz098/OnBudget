//create var to hold db connection 
let db;

// establish a connection to IndexDB database called on_budget and set it to v1.
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    //save reference to database
    const db = event.target.result;
    // create an object store (table) called `new_transaction`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
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
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const pizzaobjectStore = transaction.objectStore('new_transaction');

    //add record to Your store with the add method
    pizzaobjectStore.add(record);

}

function uploadTransaction() {
    //open a new transaction with the database with read/write permmisions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const TransObjectStore = transaction.objectStore('new_transaction');
    const getAll = TransObjectStore.getAll();

    // upon a successful .getAll() execution, run this function

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {//<-------------------------------------
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.results),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response =>  response.json())
              .then(data => {
                if (data.errors) {
                  errorEl.textContent = "Missing Information";
                }
                else {
                  // clear form
                  nameEl.value = "";
                  amountEl.value = "";
                }
              })
              .catch(err => {
                // clear form
                nameEl.value = "";
                amountEl.value = "";
              });
        }
    }
};


// listen for app coming back online
window.addEventListener('online', uploadTransaction);