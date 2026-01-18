'use client';

import React from 'react';

interface Event {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
}

interface Props {
  event: Event;
}

export default function AddToCalendarButton({ event }: Props) {
  const addToGoogleCalendar = () => {
    const start = event.startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = event.endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url =
      `https://www.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(event.title)}` +
      `&dates=${start}/${end}` +
      `&details=${encodeURIComponent(event.description)}` +
      `&location=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  const addToICalendar = () => {
    const start = event.startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = event.endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AWSM Event Organizer//${event.title}//EN
BEGIN:VEVENT
UID:${new Date().getTime()}@awsmevent.com
DTSTAMP:${start}Z
DTSTART:${start}Z
DTEND:${end}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`.trim();

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    link.click();
  };
}
