let joshData;

fetch('/static/js/joshjoshjosh.json')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        joshData = data;
        document.getElementById('table-container').innerHTML = jsonToTable(data);
    })
    .catch(error => {
        console.error('Error loading JSON:', error);
    });
