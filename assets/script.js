const revealItems = document.querySelectorAll("[data-reveal]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, {
  threshold: 0.18
});

for (const item of revealItems) {
  observer.observe(item);
}

if (!prefersReducedMotion) {
  const canvas = document.querySelector(".particle-canvas");
  const context = canvas.getContext("2d");
  const pointer = {
    x: -9999,
    y: -9999,
    active: false
  };

  let particles = [];
  let width = 0;
  let height = 0;
  let animationFrameId = 0;

  const getParticleCount = () => {
    if (window.innerWidth < 540) return 54;
    if (window.innerWidth < 900) return 82;
    return 118;
  };

  const createParticle = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.42,
    vy: (Math.random() - 0.5) * 0.42,
    radius: Math.random() * 1.9 + 1.1
  });

  const resizeCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.8);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: getParticleCount() }, createParticle);
  };

  const updateParticle = (particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    particle.x = Math.max(0, Math.min(width, particle.x));
    particle.y = Math.max(0, Math.min(height, particle.y));

    if (!pointer.active) return;

    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.hypot(dx, dy);
    const magneticRadius = 170;

    if (distance > 0 && distance < magneticRadius) {
      const pull = (1 - distance / magneticRadius) * 0.028;
      particle.vx += dx * pull * 0.02;
      particle.vy += dy * pull * 0.02;
    }

    particle.vx *= 0.992;
    particle.vy *= 0.992;
    particle.vx = Math.max(-0.65, Math.min(0.65, particle.vx));
    particle.vy = Math.max(-0.65, Math.min(0.65, particle.vy));
  };

  const drawConnections = () => {
    const maxDistance = window.innerWidth < 720 ? 90 : 128;

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.hypot(dx, dy);

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.28;
          context.strokeStyle = `rgba(108, 176, 255, ${alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(particles[i].x, particles[i].y);
          context.lineTo(particles[j].x, particles[j].y);
          context.stroke();
        }
      }
    }
  };

  const drawParticles = () => {
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      updateParticle(particle);
    }

    drawConnections();

    for (const particle of particles) {
      context.beginPath();
      context.fillStyle = "rgba(120, 194, 255, 0.88)";
      context.shadowColor = "rgba(79, 209, 197, 0.34)";
      context.shadowBlur = 10;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }

    if (pointer.active) {
      const gradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 150);
      gradient.addColorStop(0, "rgba(79, 209, 197, 0.12)");
      gradient.addColorStop(1, "rgba(79, 209, 197, 0)");
      context.beginPath();
      context.fillStyle = gradient;
      context.arc(pointer.x, pointer.y, 150, 0, Math.PI * 2);
      context.fill();
    }

    context.shadowBlur = 0;
    animationFrameId = window.requestAnimationFrame(drawParticles);
  };

  const setPointer = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  };

  window.addEventListener("pointermove", setPointer);
  window.addEventListener("pointerdown", setPointer);
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  window.addEventListener("blur", () => {
    pointer.active = false;
  });
  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pointer.active = false;
      window.cancelAnimationFrame(animationFrameId);
      return;
    }

    animationFrameId = window.requestAnimationFrame(drawParticles);
  });

  resizeCanvas();
  animationFrameId = window.requestAnimationFrame(drawParticles);
}
