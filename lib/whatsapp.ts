/**
 * Open WhatsApp with a prefilled message.
 * Mobile → wa.me deep link; Desktop → WhatsApp Web (avoids xdg-open / protocol dialogs).
 */
export function shareViaWhatsApp(phone: string | null | undefined, text: string) {
  const encodedText = encodeURIComponent(text);

  let cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "92" + cleanPhone.slice(1);
  }

  if (!cleanPhone) {
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    return;
  }

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  if (isMobile) {
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
  } else {
    window.open(
      `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`,
      "_blank"
    );
  }
}
