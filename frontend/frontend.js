const functions = document.querySelector('#functions')

document.querySelector('#addFunction').addEventListener('submit', (e) => {
  e.preventDefault()
  console.log(e)

  window.LPTE.emit({
    meta: {
      namespace: 'module-vmix',
      type: 'add',
      version: 1
    },
    function: document.querySelector('#function').value,
    listener: document.querySelector('#listener').value
  })
})

function deleteFunction(id) {
  window.LPTE.emit({
    meta: {
      namespace: 'module-vmix',
      type: 'delete',
      version: 1
    },
    id
  })
}

function displayFucntionTable(data) {
  console.log(data)
  if (data.functions === undefined) return

  functions.innerHTML = ''

  data.functions.forEach((f) => {
    const row = document.createElement('tr')

    const nameTd = document.createElement('td')
    nameTd.innerText = f.listener
    row.appendChild(nameTd)

    const handleTd = document.createElement('td')
    handleTd.innerText = f.function
    row.appendChild(handleTd)

    const deleteTd = document.createElement('td')
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add('btn', 'btn-danger')
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'
    deleteBtn.onclick = () => {
      deleteFunction(f.id)
    }
    deleteTd.appendChild(deleteBtn)
    row.appendChild(deleteTd)

    functions.appendChild(row)
  })
}

window.LPTE.onready(async () => {
  const data = await window.LPTE.request({
    meta: {
      namespace: 'module-vmix',
      type: 'request',
      version: 1
    }
  })
  displayFucntionTable(data)

  window.LPTE.on('module-vmix', 'update-vmix-set', displayFucntionTable)
})
