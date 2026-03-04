const _supabase = supabase.createClient(
  "https://nnlhjyzauoycdwutccxu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubGhqeXphdW95Y2R3dXRjY3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODMyMjcsImV4cCI6MjA4ODE1OTIyN30.Ntc0aOgn6GFXUGOdIKfOf_snFjOxNDvtr1YfyxCToU0",
);

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("header nav");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("is-active");
    nav.classList.toggle("is-open");
  });

  const itemsGrid = document.getElementById("items-grid");
  if (itemsGrid) {
    fetchLostItems();
  }
});

/* Supabase:
Has to load all entries from the table
if resolved dont load
load img, name, desc, etc. in each card.
*/

async function fetchLostItems() {
  const { data: items, error } = await _supabase.from("lostfound").select("*").eq("resolved", false).order("created_at", { ascending: false });

  if (error) {
    console.error("error fetching items:", error);
    return;
  }

  const itemsGrid = document.getElementById("items-grid");

  itemsGrid.innerHTML = items
    .map(
      (item) => `
          <div class="item-card">
              <img src="${item.img_url || "placeholder.jpg"}" alt="${item.name}">
              <div class="card-content">
                  <h3>${item.name}</h3>
                  <p>${item.description}</p>
                  <div class="card-meta">
                    ${item.claimed ? "<span>Claimed</span>" : ""}
                    <span class="date">${item.created_at.substring(0, 10)}</span>
                  </div>
              </div>
              <div class="item-claim">
                  <button onclick="startClaim('${item.id}')">Claim</button>
              </div>
          </div>
      `,
    )
    .join("");
}

async function startClaim(itemId) {
  // Use .single() to get one object directly
  const { data: item, error } = await _supabase.from("lostfound").select("*").eq("id", itemId).single();

  if (error) {
    console.error("Error fetching item details:", error);
    return;
  }

  const modal = document.getElementById("claim-modal");
  const modalBody = document.getElementById("modal-body");

  modalBody.innerHTML = `
    <div class="claim-dialog">
      <img src="${item.img_url || "placeholder.jpg"}" alt="${item.name}">
      <div class="claim-input">
        <h3>File a claim for ${item.name}</h3>
        <input type="text" id="claimant-name" placeholder="Your name">
        <input type="text" id="claimant-contact" placeholder="Email or Phone">
        <div class="modal-btns">
          <button onclick="submitClaim('${item.id}')">Submit</button>
          <button class="cancel-btn" onclick="closeModal()">Cancel</button>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("claim-modal").style.display = "none";
}

async function submitClaim(itemId) {
  const name = document.getElementById("claimant-name").value;
  const contact = document.getElementById("claimant-contact").value;

  if (!name || !contact) {
    alert("Please fill in both fields.");
    return;
  }

  const { error: claimError } = await _supabase.from("claims").insert([
    {
      id: itemId,
      name: name,
      contact: contact,
    },
  ]);

  if (claimError) {
    console.error("Error saving claim details:", claimError.message, claimError.details);
    alert(`Error: ${claimError.message}`);
    return;
  }

  await _supabase.from("lostfound").update({ claimed: true }).eq("id", itemId);

  alert("Claim submitted!");
  closeModal();
  fetchLostItems();
}

window.onclick = function (event) {
  const modal = document.getElementById("claim-modal");
  if (event.target == modal) closeModal();
};
