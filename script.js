document.getElementById('csvFile').addEventListener('change', handleFileSelect);
document.getElementById('processBtn').addEventListener('click', processCSV);

async function fetchTransactionInputs() {
  const address = document.getElementById('addressInput').value;
  const transactionInputs = await getTransactionInputByAddress(address);
  // displayTransactionInputs(transactionInputs);
}

async function getTransactionInputByAddress(address) {
  if (!Web3 || typeof Web3 === 'undefined') {
    // Check if the web3 library is available
    console.error('web3 is not available. Please make sure to connect to a provider like MetaMask.');
    return;
  }

  const web3Provider = new Web3.providers.HttpProvider('https://rpc.poolsmobility.com');
  const web3 = new Web3(web3Provider);
  const transaction = await web3.eth.getTransaction(address);
  const input = await web3.eth.abi.decodeParameters(["uint256", "address"], transaction.input.slice(10));
  return input;
}

let csvData = [];

async function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onloadend = function(e) {
    document.getElementById('processBtn').disabled = true;
    const contents = e.target.result;
    console.log(contents);
    parseCSV(contents).then(result => {
      csvData = result;
      document.getElementById('processBtn').disabled = false;
    });
  }
  reader.readAsText(file);
}

async function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');

  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');

    if (values.length === headers.length) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j].trim();
      }
      const input = await getTransactionInputByAddress(row.TxHash);
      row.amount = input['0'];
      row.to = input['1'];
      data.push(row);
      console.log('loading');
    }
  }
  return {headers: ['amount', 'to' ,...headers], data};
}

function convertArrayOfObjectsToCSV({headers, data}) {
  console.log('headers is :', headers);
  const csvColumns = headers;
  const csvRows = data.map(object => csvColumns.map(column => object[column]));

  const csvContent =
    csvColumns.join(',') + '\n' +
    csvRows.map(row => row.join(',')).join('\n');

  return csvContent;
}

function processCSV() {
  const csvContent = convertArrayOfObjectsToCSV(csvData);
  downloadCSV(csvContent, 'transaction_decoded.csv');
}

function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

