/* Seaside Smashies – kleine Helfer, kein Framework. */
(function () {
  'use strict';

  // Öffnungszeiten in Minuten seit Mitternacht. Index = Wochentag (0 = Sonntag).
  var HOURS = [
    [720, 1260], // So 12:00–21:00
    null,        // Mo Ruhetag
    [690, 1260], // Di
    [690, 1260], // Mi
    [690, 1260], // Do
    [690, 1320], // Fr
    [690, 1320]  // Sa
  ];
  var DAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  function hhmm(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  // Aktuelle Zeit in Staad, egal wo das Gerät steht.
  function zurichNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Zurich', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { day: day, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function nextOpening(day) {
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7;
      if (HOURS[d]) return { day: d, offset: i };
    }
  }

  function showHours() {
    var now = zurichNow();
    var today = HOURS[now.day];
    var open = !!today && now.min >= today[0] && now.min < today[1];
    var short, long;

    if (open) {
      short = 'Jetzt offen bis ' + hhmm(today[1]);
      long = 'Offen bis ' + hhmm(today[1]) + ' Uhr';
    } else if (today && now.min < today[0]) {
      short = 'Öffnet um ' + hhmm(today[0]);
      long = 'Wir öffnen um ' + hhmm(today[0]) + ' Uhr';
    } else {
      var n = nextOpening(now.day);
      var when = n.offset === 1 ? 'morgen' : 'am ' + DAYS[n.day];
      short = 'Öffnet ' + when + ' um ' + hhmm(HOURS[n.day][0]);
      long = (today ? 'Für heute geschlossen' : 'Montag ist Ruhetag') + ', wieder offen ' + when + ' ab ' + hhmm(HOURS[n.day][0]) + ' Uhr';
    }

    var pill = document.querySelector('[data-status]');
    if (pill) {
      pill.textContent = short;
      pill.classList.toggle('is-open', open);
      pill.hidden = false;
    }
    var line = document.querySelector('[data-today]');
    if (line) line.textContent = long;

    var row = document.querySelector('.hours tr[data-day="' + now.day + '"]');
    document.querySelectorAll('.hours tr.is-today').forEach(function (r) { r.classList.remove('is-today'); });
    if (row) row.classList.add('is-today');
  }

  showHours();
  setInterval(showHours, 60000);

  // Kategorie-Leiste: markiert, wo man in der Karte gerade liest.
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chips a'));
  if (chips.length && 'IntersectionObserver' in window) {
    var byId = {};
    chips.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        chips.forEach(function (a) { a.classList.remove('is-on'); });
        var a = byId[en.target.id];
        if (a) {
          a.classList.add('is-on');
          var bar = a.parentNode;
          bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // Google Maps erst laden, wenn jemand die Karte wirklich sehen will.
  var mapBtn = document.querySelector('[data-map-load]');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var box = document.querySelector('[data-map]');
      var frame = document.createElement('iframe');
      frame.src = 'https://www.google.com/maps?q=Hauptstrasse+2,+9422+Staad,+Schweiz&output=embed';
      frame.title = 'Karte: Seaside Smashies, Hauptstrasse 2, 9422 Staad';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      box.innerHTML = '';
      box.appendChild(frame);
    });
  }

  // Untere Bestell-Leiste auf dem Handy erst zeigen, wenn der Einstieg vorbei ist.
  var bar = document.querySelector('.bar');
  var hero = document.querySelector('.hero');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      bar.classList.toggle('is-up', !e[0].isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  } else if (bar) {
    bar.classList.add('is-up');
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
