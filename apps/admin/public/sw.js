/* Guma Commerce seller push notifications */

self.addEventListener("push", (event) => {
  let payload = { title: "Guma Commerce", body: "You have a new notification.", url: "/orders" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch (e) {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag || "guma-commerce",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url || "/orders" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/orders";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
