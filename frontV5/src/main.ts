import 'bootstrap/dist/css/bootstrap.css';
import '@fortawesome/fontawesome-free/css/all.css';
import 'css/calendar.scss';

import { Calendar } from '@fullcalendar/core';
import bootstrapPlugin from '@fullcalendar/bootstrap';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

document.addEventListener('DOMContentLoaded', function()
{
  let calendarEl: HTMLElement = document.getElementById('calendar');

  var calendar = new Calendar(calendarEl,
  {
    plugins: [bootstrapPlugin, dayGridPlugin, listPlugin],
    themeSystem: 'bootstrap',
    initialView: 'dayGridMonth',
    headerToolbar:
    {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    }
  });
  calendar.render();
});
