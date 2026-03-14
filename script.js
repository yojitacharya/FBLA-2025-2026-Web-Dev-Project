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
  const dashboard = document.getElementById("dashboard");
  if (dashboard) {
    _supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) showDashboard();
    });
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
              <img src="${item.img_url || "files/placeholder.jpg"}" alt="${item.name}">
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
      <img src="${item.img_url || "files/placeholder.jpg"}" alt="${item.name}">
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
  document.getElementById("report-modal").style.display = "none";
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

async function report() {
  const modal = document.getElementById("report-modal");
  const modalBody = document.getElementById("modal-body");
  //  <input type="text" id="item-name" placeholder="What is this item called?">
  modalBody.innerHTML = `
    <div class="report-dialog">
      <h3>Report a Lost Item</h3>
      <input type="text" id="item-name" placeholder="What is this item called?" required>
      <input type="text" id="contact" placeholder="Contact Info (Email or Phone)" required>
      <textarea id="item-description" placeholder="Describe the item..." required></textarea>
      <label style="font-size:13px; color:#888; margin-bottom:-4px;"> Add an image (optional but recommended)</label>
      <input type="file" id="item-img" accept="image/*">
      <div class="modal-btns">
        <button onclick="submitReport()">Submit</button>
        <button class="cancel-btn" onclick="document.getElementById('report-modal').style.display='none'">Cancel</button>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

async function submitReport() {
  const name = document.getElementById("item-name").value;
  const description = document.getElementById("item-description").value;
  const contact = document.getElementById("contact").value;
  const imgInput = document.getElementById("item-img");

  if (!name || !description || !contact) {
    alert("Please fill in all required fields.");
    return;
  }

  const { error: reportError } = await _supabase.from("lostfound").insert([
    {
      name: name,
      contact: contact,
      description: description,
      img_url: imgInput?.files?.[0] ? URL.createObjectURL(imgInput.files[0]) : null,
    },
  ]);

  if (reportError) {
    console.error("Error submitting your report:", reportError.message, reportError.details);
    alert(`Error: ${reportError.message}`);
    return;
  }

  alert("Report submitted successfully!");
  closeModal();
  fetchLostItems();
}

// admin stuff
//

async function adminLogin() {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  const { error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  showDashboard();
}

function showDashboard() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadAdminItems();
  loadClaims();
}

async function adminSignOut() {
  await _supabase.auth.signOut();
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
}

function switchTab(tab, btn) {
  document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  btn.classList.add("active");
}

async function loadAdminItems() {
  const { data: items, error } = await _supabase.from("lostfound").select("*, claims(name, contact, created_at)").order("created_at", { ascending: false });

  const container = document.getElementById("admin-items-list");
  if (error || !items.length) {
    container.innerHTML = `<p class="empty-state">No items found.</p>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
    <div class="admin-item-card">
      <img src="${item.img_url || "files/placeholder.jpg"}" alt="${item.name}">
      <div class="admin-item-info">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p><strong>Reporter Contact:</strong> ${item.contact || "N/A"}</p>
        <p class="meta">
          Reported: ${item.created_at.substring(0, 10)} &nbsp;|&nbsp;
          <span class="badge ${item.claimed ? "badge-claimed" : "badge-unclaimed"}">
            ${item.claimed ? "Claimed" : "Unclaimed"}
          </span>
          ${item.resolved ? '&nbsp;| <span class="badge badge-resolved">Resolved</span>' : ""}
        </p>
        ${
          item.claims?.length
            ? `
          <details>
            <summary><strong>${item.claims.length} Claim(s)</strong></summary>
            <table class="claims-table" style="margin-top:10px;">
              <thead><tr><th>Name</th><th>Contact</th><th>Date</th></tr></thead>
              <tbody>
                ${item.claims
                  .map(
                    (c) => `
                  <tr>
                    <td>${c.name}</td>
                    <td>${c.contact}</td>
                    <td>${c.created_at ? c.created_at.substring(0, 10) : "N/A"}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </details>
        `
            : "<p class='meta'>No claims yet.</p>"
        }
      </div>
      <div class="admin-item-actions">
        ${!item.resolved ? `<button onclick="resolveItem('${item.id}', true)">Resolve</button>` : ""}
        <button class="cancel-btn" onclick="deleteItem('${item.id}', true)">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");
}
async function loadClaims() {
  const { data: claims, error } = await _supabase.from("claims").select("*, lostfound(name)").order("created_at", { ascending: false });

  const container = document.getElementById("admin-claims-list");
  if (error || !claims.length) {
    container.innerHTML = `<p class="empty-state">No claims yet.</p>`;
    return;
  }

  container.innerHTML = `
    <table class="claims-table">
      <thead><tr><th>Item</th><th>Claimant Name</th><th>Contact</th><th>Date</th></tr></thead>
      <tbody>
        ${claims
          .map(
            (c) => `
          <tr>
            <td class="item-name">${c.lostfound?.name || "Unknown"}</td>
            <td>${c.name}</td>
            <td>${c.contact}</td>
            <td>${c.created_at ? c.created_at.substring(0, 10) : "N/A"}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

async function resolveItem(itemId, isAdminPage = false) {
  const { error } = await _supabase.from("lostfound").update({ resolved: true }).eq("id", itemId);

  if (error) {
    alert("Error: " + error.message);
    return;
  }
  isAdminPage ? loadAdminItems() : fetchLostItems();
}

async function deleteItem(itemId, isAdminPage = false) {
  if (!confirm("Delete this item?")) return;

  const { error } = await _supabase.from("lostfound").delete().eq("id", itemId);

  if (error) {
    alert("Error: " + error.message);
    return;
  }
  isAdminPage ? loadAdminItems() : fetchLostItems();
}
