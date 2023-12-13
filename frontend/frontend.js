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
    listener: document.querySelector('#listener').value,
    namespace: document.querySelector('#namespace').value,
  })
})

document.querySelector('#settings').addEventListener('submit', (e) => {
  e.preventDefault()

  LPTE.emit({
    meta: {
      namespace: 'module-vmix',
      type: 'set-settings',
      version: 1
    },
    ip: document.querySelector('#ip').value,
    port: parseInt(document.querySelector('#port').value)
  })
})

function initSettings(settings) {
  document.querySelector('#ip').value = settings.ip
  document.querySelector('#port').value = settings.port
}

function deleteFunction(id, namespace, listener) {
  window.LPTE.emit({
    meta: {
      namespace: 'module-vmix',
      type: 'delete',
      version: 1
    },
    id,
    namespace,
    listener
  })
}

function displayFunctionTable(data) {
  if (data.functions === undefined) return

  functions.innerHTML = ''

  data.functions.forEach((f) => {
    const row = document.createElement('tr')

    const namespaceTd = document.createElement('td')
    namespaceTd.innerText = f.namespace
    row.appendChild(namespaceTd)

    const listenerTd = document.createElement('td')
    listenerTd.innerText = f.listener
    row.appendChild(listenerTd)

    const handleTd = document.createElement('td')
    handleTd.innerText = f.function
    row.appendChild(handleTd)

    const deleteTd = document.createElement('td')
    const deleteBtn = document.createElement('button')
    deleteBtn.classList.add('btn', 'btn-danger')
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'
    deleteBtn.onclick = () => {
      deleteFunction(f.id, f.namespace, f.listener)
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
  displayFunctionTable(data)

  window.LPTE.on('module-vmix', 'update-vmix-set', displayFunctionTable)

  const settings = await LPTE.request({
    meta: {
      namespace: 'module-vmix',
      type: 'get-settings',
      version: 1
    }
  })
  initSettings(settings)

  LPTE.on('module-vmix', 'set-settings', initSettings)
})
