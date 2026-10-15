
let currentDate = new Date();
let selectedDateKey = null;
let events = {};
const monthYearDisplay = document.getElementById('month-year-display');
const daysGrid = document.getElementById('days-grid');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const selectedDateDisplay = document.getElementById('selected-date-display');
const eventForm = document.getElementById('event-form');
const eventInput = document.getElementById('event-input');
const eventsList = document.getElementById('events-list');

const notifyBtn = document.getElementById('notify-btn');
const shareBtn = document.getElementById('share-btn');

const monthNames = [
  "Gener", "Febrer", "Març", "Abril", "Maig", "Juny",
  "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"
];

function formatDateKey(year, month, day) {
  const monthString = String(month + 1).padStart(2, '0');
  const dayString = String(day).padStart(2, '0');
  return `${year}-${monthString}-${dayString}`;
}

function renderCalendar() {
  daysGrid.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const emptyDays = (firstDayOfWeek + 6) % 7;
  for (let i = 0; i < emptyDays; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.classList.add('day', 'empty');
    daysGrid.appendChild(emptyDay);
  }
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    dayElement.textContent = day;

    const dateKey = formatDateKey(year, month, day);
    dayElement.setAttribute('role', 'button');
    dayElement.setAttribute('aria-label', new Date(year, month, day).toLocaleDateString('ca-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }));
    dayElement.tabIndex = 0;

    const today = new Date();
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayElement.classList.add('today');
    }
    if (events[dateKey] && events[dateKey].length > 0) {
      dayElement.classList.add('has-events');
    }
    if (dateKey === selectedDateKey) {
      dayElement.classList.add('selected');
    }

    dayElement.addEventListener('click', () => selectDate(dateKey));
    dayElement.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectDate(dateKey);
      }
    });
    daysGrid.appendChild(dayElement);
  }
}

prevBtn.addEventListener('click', () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  renderCalendar();
});

nextBtn.addEventListener('click', () => {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar();
});

function selectDate(dateKey) {
  selectedDateKey = dateKey;
  renderCalendar();
  const [year, month, day] = dateKey.split('-').map(Number);
  selectedDateDisplay.textContent = new Date(year, month - 1, day).toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  renderEvents();
}

function renderEvents() {
  eventsList.innerHTML = '';
  const selectedEvents = selectedDateKey ? events[selectedDateKey] || [] : [];
  selectedEvents.forEach((event, index) => {
    const listItem = document.createElement('li');
    const eventText = document.createElement('span');
    const deleteButton = document.createElement('button');

    eventText.textContent = event;
    deleteButton.type = 'button';
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '✕';
    deleteButton.setAttribute('aria-label', `Eliminar ${event}`);
    deleteButton.addEventListener('click', () => removeEvent(index));

    listItem.append(eventText, deleteButton);
    eventsList.appendChild(listItem);
  });
}

function addEvent(e) {
  e.preventDefault();
  const eventText = eventInput.value.trim();
  if (!selectedDateKey) {
    window.alert('Selecciona un dia abans d’afegir un esdeveniment.');
    return;
  }
  if (!eventText) {
    eventInput.value = '';
    eventInput.focus();
    return;
  }
  if (!Array.isArray(events[selectedDateKey])) {
    events[selectedDateKey] = [];
  }
  events[selectedDateKey].push(eventText);
  eventInput.value = '';
  saveEvents();
  renderEvents();
  renderCalendar();
}

function removeEvent(index) {
  if (!selectedDateKey || !Array.isArray(events[selectedDateKey])) {
    return;
  }
  events[selectedDateKey].splice(index, 1);
  if (events[selectedDateKey].length === 0) {
    delete events[selectedDateKey];
  }
  saveEvents();
  renderEvents();
  renderCalendar();
}
eventForm.addEventListener('submit', addEvent);

function saveEvents() {
  try {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  } catch (error) {
    console.error('No s’han pogut desar els esdeveniments.', error);
    window.alert('No s’han pogut desar els esdeveniments en aquest navegador.');
  }
}

function loadEvents() {
  try {
    const storedEvents = localStorage.getItem('calendar_events');
    if (!storedEvents) {
      return {};
    }

    const parsedEvents = JSON.parse(storedEvents);
    if (!parsedEvents || typeof parsedEvents !== 'object' || Array.isArray(parsedEvents)) {
      throw new Error('El format desat no és vàlid.');
    }

    return Object.fromEntries(
      Object.entries(parsedEvents).filter(([dateKey, dayEvents]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(dateKey) &&
        Array.isArray(dayEvents) &&
        dayEvents.every(event => typeof event === 'string')
      )
    );
  } catch (error) {
    console.error('No s’han pogut carregar els esdeveniments desats.', error);
    return {};
  }
}

function sendNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  new Notification(title, { body });
  return true;
}

notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    window.alert('Aquest navegador no permet notificacions.');
    return;
  }

  try {
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    if (permission !== 'granted') {
      notifyBtn.textContent = '🔔 Activar Notificacions';
      window.alert('No s’ha concedit el permís per a les notificacions.');
      return;
    }

    notifyBtn.textContent = '🔔 Notificacions activades';
    const dateText = selectedDateKey || 'cap dia seleccionat';
    const dayEvents = selectedDateKey ? events[selectedDateKey] || [] : [];
    sendNotification(
      'Calendari',
      selectedDateKey
        ? `${dateText}: ${dayEvents.length ? dayEvents.join(', ') : 'No hi ha esdeveniments.'}`
        : 'Les notificacions estan activades.'
    );
  } catch (error) {
    console.error('No s’ha pogut activar la notificació.', error);
    window.alert('No s’ha pogut activar la notificació.');
  }
});

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temporaryInput = document.createElement('textarea');
  temporaryInput.value = text;
  temporaryInput.setAttribute('readonly', '');
  temporaryInput.style.position = 'fixed';
  temporaryInput.style.opacity = '0';
  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand('copy');
  temporaryInput.remove();

  if (!copied) {
    throw new Error('El navegador no ha pogut copiar el text.');
  }
}

shareBtn.addEventListener('click', async () => {
  if (!selectedDateKey) {
    window.alert('Selecciona un dia abans de compartir-lo.');
    return;
  }

  const dayEvents = events[selectedDateKey] || [];
  const shareText = [
    `Calendari del ${selectedDateKey}`,
    ...(dayEvents.length ? dayEvents : ['No hi ha esdeveniments.'])
  ].join('\n');

  try {
    if (navigator.share) {
      await navigator.share({
        title: `Calendari del ${selectedDateKey}`,
        text: shareText
      });
      return;
    }

    await copyToClipboard(shareText);
    window.alert('El resum del dia s’ha copiat al porta-retalls.');
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return;
    }
    console.error('No s’ha pogut compartir el dia.', error);
    window.alert('No s’ha pogut compartir el dia ni copiar-lo al porta-retalls.');
  }
});

function initApp() {
  events = loadEvents();
  const today = new Date();
  selectedDateKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  renderCalendar();
  selectDate(selectedDateKey);
  if ('Notification' in window && Notification.permission === 'granted') {
    notifyBtn.textContent = '🔔 Notificacions activades';
  }
}

initApp();
