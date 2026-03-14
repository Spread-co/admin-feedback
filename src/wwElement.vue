<template>
  <div v-if="!content.portalTarget || content.portalTarget === 'admin'" class="af-root">

    <!-- Section Nav -->
    <nav class="af-section-nav" role="navigation" aria-label="Feedback sections">
      <button
        v-for="sec in sections"
        :key="sec.id"
        class="af-section-btn"
        :class="{ 'af-section-btn--active': activeSection === sec.id }"
        @click="switchSection(sec.id)"
      >
        <span class="af-section-btn-icon" v-html="sec.icon" aria-hidden="true"></span>
        {{ sec.label }}
        <span v-if="sec.id === 'reviews' && pendingCount > 0" class="af-badge">{{ pendingCount }}</span>
      </button>
    </nav>

    <!-- ══════════════════════════════════════════════
         SECTION 1: Reviews Inbox
    ══════════════════════════════════════════════ -->
    <section v-if="activeSection === 'reviews'" class="af-section">
      <div class="af-section-header">
        <h2 class="af-section-title">Reviews Inbox</h2>
        <div class="af-toolbar">
          <select class="af-select af-select--sm" v-model="reviewStatusFilter" @change="reviewsPage = 0; loadReviews()">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          <button class="af-btn af-btn--ghost" @click="loadReviews" :disabled="reviewsLoading">
            <span v-html="ICONS.refresh" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <div v-if="reviewsLoading" class="af-loading">
        <span class="af-spinner"></span> Loading reviews…
      </div>

      <div v-else-if="reviews.length === 0" class="af-empty">
        No {{ reviewStatusFilter || 'matching' }} reviews.
      </div>

      <div v-else class="af-table-wrap">
        <table class="af-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Category</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th class="af-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="review in reviews"
              :key="review.id"
              class="af-row af-row--clickable"
              @click="selectReview(review)"
              tabindex="0"
              @keydown.enter="selectReview(review)"
              :aria-selected="selectedReview && selectedReview.id === review.id"
            >
              <td class="af-cell-name">{{ review.member_name || '—' }}</td>
              <td>
                <span class="af-tag">{{ review.category_name }}</span>
              </td>
              <td class="af-cell-rating">
                <span class="af-stars-display">
                  <span v-for="n in 5" :key="n" :class="{ 'af-star-on': n <= review.rating }">★</span>
                </span>
              </td>
              <td class="af-cell-comment">
                <span class="af-comment-text" :title="review.comment">{{ review.comment || '—' }}</span>
              </td>
              <td class="af-cell-date">{{ formatDate(review.created_at) }}</td>
              <td class="af-cell-actions" @click.stop>
                <div class="af-action-group">
                  <button
                    v-if="review.status === 'pending'"
                    class="af-action-btn af-action-btn--accept"
                    @click="actionReview(review.id, 'accept')"
                    :disabled="actionLoadingId === review.id"
                    title="Accept"
                  >
                    <span v-html="ICONS.check" aria-hidden="true"></span>
                  </button>
                  <button
                    v-if="review.status === 'accepted'"
                    class="af-action-btn af-action-btn--publish"
                    @click="actionReview(review.id, 'publish')"
                    :disabled="actionLoadingId === review.id"
                    title="Publish to testimonials"
                  >
                    <span v-html="ICONS.publish" aria-hidden="true"></span>
                  </button>
                  <button
                    v-if="review.status !== 'rejected'"
                    class="af-action-btn af-action-btn--reject"
                    @click="actionReview(review.id, 'reject')"
                    :disabled="actionLoadingId === review.id"
                    title="Reject"
                  >
                    <span v-html="ICONS.reject" aria-hidden="true"></span>
                  </button>
                  <span v-if="review.status === 'rejected'" class="af-status-badge af-status-badge--rejected">Rejected</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="reviews.length > 0 || reviewsPage > 0" class="af-pagination">
        <button class="af-btn af-btn--ghost af-btn--sm" @click="prevReviewsPage" :disabled="reviewsPage === 0 || reviewsLoading">
          ← Prev
        </button>
        <span class="af-pagination-label">Page {{ reviewsPage + 1 }}</span>
        <button class="af-btn af-btn--ghost af-btn--sm" @click="nextReviewsPage" :disabled="reviews.length < reviewsPageSize || reviewsLoading">
          Next →
        </button>
      </div>

      <!-- Slide-in detail panel -->
      <transition name="af-detail-slide">
        <div v-if="selectedReview" class="af-detail-panel" role="dialog" aria-modal="false" :aria-label="`Review by ${selectedReview.member_name || 'member'}`">
          <div class="af-detail-header">
            <h3 class="af-detail-title">Review Detail</h3>
            <button class="af-detail-close" @click="selectedReview = null" aria-label="Close detail panel">✕</button>
          </div>
          <div class="af-detail-body">
            <div class="af-detail-stars">
              <span v-for="n in 5" :key="n" :class="{ 'af-star-on': n <= selectedReview.rating }">★</span>
            </div>
            <div class="af-detail-meta">
              <span class="af-detail-name">{{ selectedReview.member_name || 'Anonymous' }}</span>
              <span class="af-detail-sep">·</span>
              <span class="af-tag">{{ selectedReview.category_name }}</span>
              <span class="af-detail-sep">·</span>
              <span class="af-detail-date">{{ formatDate(selectedReview.created_at) }}</span>
            </div>
            <p class="af-detail-comment">{{ selectedReview.comment || '(No comment)' }}</p>
            <div class="af-detail-status">
              <span class="af-status-badge" :class="`af-status-badge--${selectedReview.status}`">
                {{ selectedReview.status }}
              </span>
            </div>
            <div class="af-detail-actions">
              <button
                v-if="selectedReview.status === 'pending'"
                class="af-btn af-btn--accept"
                @click="actionReview(selectedReview.id, 'accept').then(() => selectedReview = null)"
                :disabled="actionLoadingId === selectedReview.id"
              >Accept</button>
              <button
                v-if="selectedReview.status === 'accepted'"
                class="af-btn af-btn--primary"
                @click="actionReview(selectedReview.id, 'publish').then(() => selectedReview = null)"
                :disabled="actionLoadingId === selectedReview.id"
              >Publish</button>
              <button
                v-if="selectedReview.status !== 'rejected' && selectedReview.status !== 'published'"
                class="af-btn af-btn--danger"
                @click="actionReview(selectedReview.id, 'reject').then(() => selectedReview = null)"
                :disabled="actionLoadingId === selectedReview.id"
              >Reject</button>
              <button class="af-btn af-btn--ghost" @click="selectedReview = null">Close</button>
            </div>
          </div>
        </div>
      </transition>
      <div v-if="selectedReview" class="af-detail-overlay" @click="selectedReview = null"></div>
    </section>

    <!-- ══════════════════════════════════════════════
         SECTION 2: Feature Rollout
    ══════════════════════════════════════════════ -->
    <section v-if="activeSection === 'features'" class="af-section">
      <div class="af-section-header">
        <h2 class="af-section-title">Feature Rollout</h2>
        <div class="af-toolbar">
          <!-- Master toggle -->
          <div class="af-toggle-row">
            <span class="af-toggle-label">Upvote system</span>
            <button
              class="af-toggle"
              :class="{ 'af-toggle--on': featureUpvoteEnabled }"
              @click="toggleUpvoteSystem"
              :disabled="toggleLoading"
              role="switch"
              :aria-checked="featureUpvoteEnabled"
              :aria-label="featureUpvoteEnabled ? 'Disable upvote system' : 'Enable upvote system'"
            >
              <span class="af-toggle-thumb"></span>
            </button>
            <span class="af-toggle-status" :class="{ 'af-toggle-status--on': featureUpvoteEnabled }">
              {{ featureUpvoteEnabled ? 'ON' : 'OFF' }}
            </span>
          </div>
          <button class="af-btn af-btn--primary" @click="openFeatureForm()">
            <span v-html="ICONS.plus" aria-hidden="true"></span>
            Add Feature
          </button>
        </div>
      </div>

      <!-- Feature form (inline) -->
      <div v-if="featureFormOpen" class="af-inline-form">
        <h3 class="af-inline-form-title">{{ editingFeatureId ? 'Edit Feature' : 'New Feature Request' }}</h3>
        <div class="af-field-row">
          <label class="af-label" :for="`af-feat-title-${uid}`">Title <span class="af-required">*</span></label>
          <input
            :id="`af-feat-title-${uid}`"
            class="af-input"
            v-model="featureForm.title"
            placeholder="e.g. Recurring orders"
            maxlength="200"
          />
        </div>
        <div class="af-field-row">
          <label class="af-label" :for="`af-feat-desc-${uid}`">Description</label>
          <textarea
            :id="`af-feat-desc-${uid}`"
            class="af-textarea"
            v-model="featureForm.description"
            placeholder="Optional — explain the feature"
            rows="3"
            maxlength="1000"
          ></textarea>
        </div>
        <div v-if="featureFormError" class="af-error-msg" role="alert">{{ featureFormError }}</div>
        <div class="af-form-actions">
          <button class="af-btn af-btn--ghost" @click="closeFeatureForm">Cancel</button>
          <button class="af-btn af-btn--primary" @click="saveFeature" :disabled="featureFormLoading || !featureForm.title.trim()">
            {{ featureFormLoading ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>

      <div v-if="featuresLoading" class="af-loading">
        <span class="af-spinner"></span> Loading features…
      </div>
      <div v-else-if="features.length === 0" class="af-empty">
        No feature requests yet. Add one above.
      </div>
      <div v-else class="af-table-wrap">
        <table class="af-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th class="af-col-num">Net Score</th>
              <th class="af-col-num">Upvotes</th>
              <th class="af-col-num">Downvotes</th>
              <th>Status</th>
              <th class="af-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="feat in features" :key="feat.id" class="af-row">
              <td class="af-cell-name">{{ feat.title }}</td>
              <td class="af-cell-comment"><span class="af-comment-text" :title="feat.description">{{ feat.description || '—' }}</span></td>
              <td class="af-cell-num">
                <span class="af-score" :class="{ 'af-score--up': feat.net_score > 0, 'af-score--down': feat.net_score < 0 }">
                  {{ feat.net_score > 0 ? '+' : '' }}{{ feat.net_score }}
                </span>
              </td>
              <td class="af-cell-num">{{ feat.upvotes }}</td>
              <td class="af-cell-num">{{ feat.downvotes }}</td>
              <td>
                <span class="af-status-badge" :class="`af-status-badge--${feat.is_active ? 'active' : 'inactive'}`">
                  {{ feat.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="af-cell-actions">
                <div class="af-action-group">
                  <button class="af-action-btn af-action-btn--edit" @click="openFeatureForm(feat)" title="Edit">
                    <span v-html="ICONS.edit" aria-hidden="true"></span>
                  </button>
                  <button
                    v-if="feat.is_active"
                    class="af-action-btn af-action-btn--reject"
                    @click="deactivateFeature(feat.id)"
                    :disabled="actionLoadingId === feat.id"
                    title="Deactivate"
                  >
                    <span v-html="ICONS.reject" aria-hidden="true"></span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════
         SECTION 3: Review Categories
    ══════════════════════════════════════════════ -->
    <section v-if="activeSection === 'categories'" class="af-section">
      <div class="af-section-header">
        <h2 class="af-section-title">Review Categories</h2>
        <button class="af-btn af-btn--primary" @click="openCategoryForm()">
          <span v-html="ICONS.plus" aria-hidden="true"></span>
          Add Category
        </button>
      </div>

      <!-- Category form (inline) -->
      <div v-if="categoryFormOpen" class="af-inline-form">
        <h3 class="af-inline-form-title">{{ editingCategoryId ? 'Edit Category' : 'New Category' }}</h3>
        <div class="af-field-row">
          <label class="af-label" :for="`af-cat-name-${uid}`">Name <span class="af-required">*</span></label>
          <input
            :id="`af-cat-name-${uid}`"
            class="af-input"
            v-model="categoryForm.name"
            placeholder="e.g. Product Quality"
            maxlength="100"
          />
        </div>
        <div class="af-field-row">
          <label class="af-label" :for="`af-cat-desc-${uid}`">Description</label>
          <input
            :id="`af-cat-desc-${uid}`"
            class="af-input"
            v-model="categoryForm.description"
            placeholder="Optional"
            maxlength="300"
          />
        </div>
        <div class="af-field-row">
          <label class="af-label" :for="`af-cat-sort-${uid}`">Sort Order</label>
          <input
            :id="`af-cat-sort-${uid}`"
            class="af-input af-input--sm"
            type="number"
            min="0"
            max="999"
            v-model.number="categoryForm.sort_order"
          />
        </div>
        <div v-if="categoryFormError" class="af-error-msg" role="alert">{{ categoryFormError }}</div>
        <div class="af-form-actions">
          <button class="af-btn af-btn--ghost" @click="closeCategoryForm">Cancel</button>
          <button class="af-btn af-btn--primary" @click="saveCategory" :disabled="categoryFormLoading || !categoryForm.name.trim()">
            {{ categoryFormLoading ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>

      <div v-if="categoriesLoading" class="af-loading">
        <span class="af-spinner"></span> Loading categories…
      </div>
      <div v-else-if="categories.length === 0" class="af-empty">
        No categories yet. Add your first category above.
      </div>
      <ul v-else class="af-category-list" role="list" aria-label="Drag to reorder categories">
        <li
          v-for="(cat, idx) in categories"
          :key="cat.id"
          class="af-category-row"
          :class="{ 'af-category-row--dragging': dragIndex === idx, 'af-category-row--over': dragoverIndex === idx }"
          draggable="true"
          @dragstart="onCatDragStart(idx)"
          @dragover.prevent="onCatDragOver(idx)"
          @drop.prevent="onCatDrop(idx)"
          @dragend="onCatDragEnd"
          :aria-grabbed="dragIndex === idx"
        >
          <span class="af-category-drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span>
          <div class="af-category-info">
            <span class="af-category-name">{{ cat.name }}</span>
            <span v-if="cat.description" class="af-category-desc">{{ cat.description }}</span>
          </div>
          <div class="af-action-group">
            <button class="af-action-btn af-action-btn--edit" @click="openCategoryForm(cat)" title="Edit">
              <span v-html="ICONS.edit" aria-hidden="true"></span>
            </button>
            <button
              class="af-action-btn af-action-btn--reject"
              @click="deleteCategory(cat.id)"
              :disabled="actionLoadingId === cat.id"
              title="Delete"
            >
              <span v-html="ICONS.trash" aria-hidden="true"></span>
            </button>
          </div>
        </li>
      </ul>
    </section>

    <!-- Global error toast -->
    <div v-if="globalError" class="af-toast af-toast--error" role="alert">
      {{ globalError }}
      <button class="af-toast-close" @click="globalError = null">✕</button>
    </div>

  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

// ── Inline icons ──────────────────────────────────────────────────────────
const ICONS = {
  reviews:   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  features:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  categories:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  refresh:   '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  plus:      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  check:     '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  publish:   '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  reject:    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  edit:      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash:     '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
};

// ── Inline Supabase client ────────────────────────────────────────────────
function createSpreadClient(supabaseUrl, supabaseAnonKey, accessToken = null) {
  const headers = { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  return {
    async rpc(fn, params = {}) {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: 'POST', headers, body: JSON.stringify(params),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || res.statusText);
      }
      return res.json();
    },
  };
}

export default {
  props: {
    uid: { type: String, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
    content:        { type: Object, required: true },
    wwFrontState:   { type: Object, required: true },
    wwElementState: { type: Object, required: true },
  },
  emits: ['trigger-event', 'update:content'],

  setup(props, { emit }) {
    const supabaseUrl     = computed(() => props.content?.supabaseUrl || '');
    const supabaseAnonKey = computed(() => props.content?.supabaseAnonKey || '');
    const accessToken     = computed(() => props.content?.accessToken || '');
    const defaultSection  = computed(() => props.content?.defaultSection || 'reviews');

    function client() {
      return createSpreadClient(supabaseUrl.value, supabaseAnonKey.value, accessToken.value);
    }

    // ── Section nav ───────────────────────────────────────────────────────
    const activeSection = ref(defaultSection.value);

    const sections = [
      { id: 'reviews',    label: 'Reviews Inbox',     icon: ICONS.reviews },
      { id: 'features',   label: 'Feature Rollout',    icon: ICONS.features },
      { id: 'categories', label: 'Review Categories',  icon: ICONS.categories },
    ];

    function switchSection(id) {
      activeSection.value = id;
      closeForms();
      if (id === 'reviews')    loadReviews();
      if (id === 'features')   loadFeatures();
      if (id === 'categories') loadCategories();
    }

    // ── Global error ──────────────────────────────────────────────────────
    const globalError = ref(null);
    function setError(msg) {
      globalError.value = msg;
      emit('trigger-event', { name: 'feedback:error', event: { message: msg } });
      setTimeout(() => { if (globalError.value === msg) globalError.value = null; }, 5000);
    }

    // ── Shared action loading ─────────────────────────────────────────────
    const actionLoadingId = ref(null);

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 1: Reviews
    // ══════════════════════════════════════════════════════════════════════
    const reviews           = ref([]);
    const reviewsLoading    = ref(false);
    const reviewStatusFilter = ref('pending');
    const pendingCount      = ref(0);
    const reviewsPage       = ref(0);
    const reviewsPageSize   = 25;
    const selectedReview    = ref(null);

    function selectReview(review) {
      selectedReview.value = review;
    }

    function prevReviewsPage() {
      if (reviewsPage.value > 0) { reviewsPage.value--; loadReviews(); }
    }

    function nextReviewsPage() {
      reviewsPage.value++;
      loadReviews();
    }

    async function loadReviews() {
      reviewsLoading.value = true;
      selectedReview.value = null;
      try {
        const params = { p_limit: reviewsPageSize, p_offset: reviewsPage.value * reviewsPageSize };
        if (reviewStatusFilter.value) params.p_status = reviewStatusFilter.value;
        const data = await client().rpc('get_pending_reviews', params);
        reviews.value = Array.isArray(data) ? data : [];
        if (!reviewStatusFilter.value || reviewStatusFilter.value === 'pending') {
          const pendingData = reviewStatusFilter.value === 'pending'
            ? reviews.value
            : await client().rpc('get_pending_reviews', { p_status: 'pending', p_limit: 1000 }).catch(() => []);
          pendingCount.value = Array.isArray(pendingData) && reviewStatusFilter.value === 'pending'
            ? reviews.value.length
            : pendingCount.value;
        }
        if (reviewStatusFilter.value === 'pending') pendingCount.value = reviews.value.length;
      } catch (err) {
        setError(err.message || 'Failed to load reviews.');
        reviews.value = [];
      } finally {
        reviewsLoading.value = false;
      }
    }

    async function actionReview(reviewId, action) {
      actionLoadingId.value = reviewId;
      try {
        const fn = action === 'accept' ? 'accept_review' : action === 'publish' ? 'publish_review' : 'reject_review';
        await client().rpc(fn, { p_review_id: reviewId });
        reviews.value = reviews.value.filter(r => r.id !== reviewId);
        if (reviewStatusFilter.value === 'pending') pendingCount.value = Math.max(0, pendingCount.value - 1);
        const eventName = action === 'publish' ? 'feedback:reviewPublished'
                        : action === 'accept'  ? 'feedback:reviewAccepted'
                        : 'feedback:reviewRejected';
        emit('trigger-event', { name: eventName, event: { reviewId } });
      } catch (err) {
        setError(err.message || `Failed to ${action} review.`);
      } finally {
        actionLoadingId.value = null;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 2: Features
    // ══════════════════════════════════════════════════════════════════════
    const features             = ref([]);
    const featuresLoading      = ref(false);
    const featureUpvoteEnabled = ref(true);
    const toggleLoading        = ref(false);
    const featureFormOpen      = ref(false);
    const editingFeatureId     = ref(null);
    const featureForm          = ref({ title: '', description: '' });
    const featureFormLoading   = ref(false);
    const featureFormError     = ref(null);

    async function loadFeatures() {
      featuresLoading.value = true;
      try {
        const [featData, settings] = await Promise.all([
          client().rpc('get_feature_requests_admin'),
          client().rpc('get_platform_settings'),
        ]);
        features.value = Array.isArray(featData) ? featData : [];
        featureUpvoteEnabled.value = settings?.feature_upvote_enabled ?? true;
      } catch (err) {
        setError(err.message || 'Failed to load feature requests.');
      } finally {
        featuresLoading.value = false;
      }
    }

    async function toggleUpvoteSystem() {
      toggleLoading.value = true;
      try {
        const newVal = !featureUpvoteEnabled.value;
        await client().rpc('toggle_feature_upvote_system', { p_enabled: newVal });
        featureUpvoteEnabled.value = newVal;
        emit('trigger-event', { name: 'feedback:toggleChanged', event: { enabled: newVal } });
      } catch (err) {
        setError(err.message || 'Failed to toggle system.');
      } finally {
        toggleLoading.value = false;
      }
    }

    function openFeatureForm(feat = null) {
      editingFeatureId.value = feat?.id || null;
      featureForm.value = { title: feat?.title || '', description: feat?.description || '' };
      featureFormError.value = null;
      featureFormOpen.value = true;
    }

    function closeFeatureForm() {
      featureFormOpen.value = false;
      editingFeatureId.value = null;
    }

    async function saveFeature() {
      if (!featureForm.value.title.trim()) return;
      featureFormLoading.value = true;
      featureFormError.value = null;
      try {
        if (editingFeatureId.value) {
          await client().rpc('update_feature_request', {
            p_feature_id: editingFeatureId.value,
            p_title: featureForm.value.title.trim(),
            p_description: featureForm.value.description.trim() || null,
          });
        } else {
          await client().rpc('create_feature_request', {
            p_title: featureForm.value.title.trim(),
            p_description: featureForm.value.description.trim() || null,
          });
          emit('trigger-event', { name: 'feedback:featureCreated', event: { title: featureForm.value.title } });
        }
        closeFeatureForm();
        await loadFeatures();
      } catch (err) {
        featureFormError.value = err.message || 'Save failed.';
      } finally {
        featureFormLoading.value = false;
      }
    }

    async function deactivateFeature(featureId) {
      actionLoadingId.value = featureId;
      try {
        await client().rpc('deactivate_feature_request', { p_feature_id: featureId });
        const feat = features.value.find(f => f.id === featureId);
        if (feat) feat.is_active = false;
        emit('trigger-event', { name: 'feedback:featureDeactivated', event: { featureId } });
      } catch (err) {
        setError(err.message || 'Failed to deactivate feature.');
      } finally {
        actionLoadingId.value = null;
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // SECTION 3: Categories
    // ══════════════════════════════════════════════════════════════════════
    const categories          = ref([]);
    const categoriesLoading   = ref(false);
    const categoryFormOpen    = ref(false);
    const editingCategoryId   = ref(null);
    const categoryForm        = ref({ name: '', description: '', sort_order: 0 });
    const categoryFormLoading = ref(false);
    const categoryFormError   = ref(null);

    async function loadCategories() {
      categoriesLoading.value = true;
      try {
        const data = await client().rpc('get_review_categories_admin');
        categories.value = Array.isArray(data) ? data : [];
      } catch (err) {
        setError(err.message || 'Failed to load categories.');
      } finally {
        categoriesLoading.value = false;
      }
    }

    function openCategoryForm(cat = null) {
      editingCategoryId.value = cat?.id || null;
      categoryForm.value = { name: cat?.name || '', description: cat?.description || '', sort_order: cat?.sort_order ?? 0 };
      categoryFormError.value = null;
      categoryFormOpen.value = true;
    }

    function closeCategoryForm() {
      categoryFormOpen.value = false;
      editingCategoryId.value = null;
    }

    async function saveCategory() {
      if (!categoryForm.value.name.trim()) return;
      categoryFormLoading.value = true;
      categoryFormError.value = null;
      try {
        if (editingCategoryId.value) {
          await client().rpc('update_review_category', {
            p_category_id: editingCategoryId.value,
            p_name: categoryForm.value.name.trim(),
            p_description: categoryForm.value.description.trim() || null,
            p_sort_order: categoryForm.value.sort_order ?? 0,
          });
          emit('trigger-event', { name: 'feedback:categoryUpdated', event: { action: 'update', id: editingCategoryId.value } });
        } else {
          await client().rpc('create_review_category', {
            p_name: categoryForm.value.name.trim(),
            p_description: categoryForm.value.description.trim() || null,
            p_sort_order: categoryForm.value.sort_order ?? 0,
          });
          emit('trigger-event', { name: 'feedback:categoryUpdated', event: { action: 'create', id: '' } });
        }
        closeCategoryForm();
        await loadCategories();
      } catch (err) {
        categoryFormError.value = err.message || 'Save failed.';
      } finally {
        categoryFormLoading.value = false;
      }
    }

    async function deleteCategory(categoryId) {
      if (!confirm('Delete this category? Existing reviews will retain their category reference.')) return;
      actionLoadingId.value = categoryId;
      try {
        await client().rpc('delete_review_category', { p_category_id: categoryId });
        categories.value = categories.value.filter(c => c.id !== categoryId);
        emit('trigger-event', { name: 'feedback:categoryUpdated', event: { action: 'delete', id: categoryId } });
      } catch (err) {
        setError(err.message || 'Failed to delete category.');
      } finally {
        actionLoadingId.value = null;
      }
    }

    function closeForms() {
      closeFeatureForm();
      closeCategoryForm();
    }

    // ── Category drag-to-sort ─────────────────────────────────────────────
    const dragIndex     = ref(null);
    const dragoverIndex = ref(null);

    function onCatDragStart(idx) {
      dragIndex.value = idx;
    }

    function onCatDragOver(idx) {
      dragoverIndex.value = idx;
    }

    async function onCatDrop(toIdx) {
      const fromIdx = dragIndex.value;
      if (fromIdx === null || fromIdx === toIdx) return;
      const items = [...categories.value];
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      // Reassign display_order in increments of 10
      items.forEach((cat, i) => { cat.sort_order = i * 10; });
      categories.value = items;
      // Persist each changed item
      try {
        await Promise.all(items.map((cat, i) =>
          client().rpc('update_review_category', {
            p_category_id: cat.id,
            p_name: cat.name,
            p_description: cat.description || null,
            p_sort_order: i * 10,
          })
        ));
        emit('trigger-event', { name: 'feedback:categoryUpdated', event: { action: 'reorder', id: '' } });
      } catch (err) {
        setError(err.message || 'Failed to save category order.');
        await loadCategories(); // reload to restore true state on error
      }
    }

    function onCatDragEnd() {
      dragIndex.value    = null;
      dragoverIndex.value = null;
    }

    // ── Utility ───────────────────────────────────────────────────────────
    function formatDate(iso) {
      if (!iso) return '—';
      try {
        return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (_) { return iso; }
    }

    // ── Init + watchers ───────────────────────────────────────────────────
    onMounted(() => {
      if (supabaseUrl.value) loadReviews();
    });

    watch(() => props.content?.refreshTrigger, () => {
      if (activeSection.value === 'reviews')    loadReviews();
      if (activeSection.value === 'features')   loadFeatures();
      if (activeSection.value === 'categories') loadCategories();
    });

    // ── Editor mock ───────────────────────────────────────────────────────
    /* wwEditor:start */
    reviews.value = [
      { id: '1', member_name: 'Alice T.', category_name: 'Delivery', rating: 5, comment: 'Super fast, loved it.', created_at: new Date().toISOString(), status: 'pending' },
      { id: '2', member_name: 'Ben R.', category_name: 'Product Quality', rating: 4, comment: 'Everything was fresh.', created_at: new Date().toISOString(), status: 'pending' },
    ];
    pendingCount.value = 2;
    features.value = [
      { id: '1', title: 'Recurring orders', description: 'Auto-schedule weekly boxes.', net_score: 14, upvotes: 16, downvotes: 2, is_active: true },
      { id: '2', title: 'Wishlist', description: null, net_score: 7, upvotes: 7, downvotes: 0, is_active: true },
    ];
    categories.value = [
      { id: 'a', name: 'Product Quality', description: null, sort_order: 0 },
      { id: 'b', name: 'Delivery', description: null, sort_order: 1 },
      { id: 'c', name: 'Overall Experience', description: null, sort_order: 2 },
    ];
    /* wwEditor:end */

    return {
      ICONS,
      activeSection, sections,
      globalError,
      actionLoadingId,
      // reviews
      reviews, reviewsLoading, reviewStatusFilter, pendingCount,
      reviewsPage, reviewsPageSize, selectedReview,
      loadReviews, actionReview, selectReview, prevReviewsPage, nextReviewsPage,
      // features
      features, featuresLoading, featureUpvoteEnabled, toggleLoading,
      featureFormOpen, editingFeatureId, featureForm, featureFormLoading, featureFormError,
      loadFeatures, toggleUpvoteSystem, openFeatureForm, closeFeatureForm, saveFeature, deactivateFeature,
      // categories
      categories, categoriesLoading,
      categoryFormOpen, editingCategoryId, categoryForm, categoryFormLoading, categoryFormError,
      dragIndex, dragoverIndex,
      loadCategories, openCategoryForm, closeCategoryForm, saveCategory, deleteCategory,
      onCatDragStart, onCatDragOver, onCatDrop, onCatDragEnd,
      // utils
      switchSection, formatDate,
    };
  },
};
</script>

<style scoped>
/* ── Design tokens ─────────────────────────────────────────────────────── */
.af-root {
  --af-primary: #4B162D;
  --af-accent: #C86A3A;
  --af-accent-hover: #b55e31;
  --af-success: #16A34A;
  --af-error: #DC2626;
  --af-warning: #D97706;
  --af-sand: #EDC79F;
  --af-bg: #FAF7F2;
  --af-surface: #FFFFFF;
  --af-border: #E8DDD4;
  --af-text: #1A0A10;
  --af-text-secondary: #6B5B52;
  --af-font: 'Work Sans', -apple-system, sans-serif;
  --af-radius-sm: 6px;
  --af-radius-md: 10px;
  --af-radius-lg: 14px;

  font-family: var(--af-font);
  color: var(--af-text);
  background: var(--af-bg);
  min-height: 400px;
  border-radius: var(--af-radius-lg);
  overflow: hidden;
  max-width: 1440px;
  margin-inline: auto;
}

/* ── Section nav ───────────────────────────────────────────────────────── */
.af-section-nav {
  display: flex;
  background: var(--af-primary);
  padding: 0 16px;
  gap: 2px;
  overflow-x: auto;
}

.af-section-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 14px 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-family: var(--af-font);
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.12s ease, border-color 0.12s ease;
  position: relative;
}

.af-section-btn:hover {
  color: rgba(255,255,255,0.88);
}

.af-section-btn--active {
  color: #fff;
  border-bottom-color: var(--af-sand);
}

.af-section-btn-icon {
  display: flex;
  align-items: center;
}

.af-section-btn-icon svg { stroke: currentColor; }

.af-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--af-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Section wrapper ───────────────────────────────────────────────────── */
.af-section {
  padding: 20px;
}

.af-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.af-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--af-primary);
  margin: 0;
}

/* ── Toolbar ───────────────────────────────────────────────────────────── */
.af-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── Buttons ───────────────────────────────────────────────────────────── */
.af-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--af-radius-sm);
  font-family: var(--af-font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease, opacity 0.12s ease;
  border: none;
  white-space: nowrap;
}

.af-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.af-btn--primary {
  background: var(--af-accent);
  color: #fff;
}

.af-btn--primary:hover:not(:disabled) { background: var(--af-accent-hover); }

.af-btn--ghost {
  background: transparent;
  color: var(--af-text-secondary);
  border: 1.5px solid var(--af-border);
}

.af-btn--ghost:hover:not(:disabled) {
  background: var(--af-border);
  color: var(--af-text);
}

/* ── Select ────────────────────────────────────────────────────────────── */
.af-select {
  padding: 8px 12px;
  border: 1.5px solid var(--af-border);
  border-radius: var(--af-radius-sm);
  font-family: var(--af-font);
  font-size: 13px;
  color: var(--af-text);
  background: var(--af-surface);
  cursor: pointer;
}

.af-select:focus { outline: none; border-color: var(--af-accent); }

/* ── Toggle ────────────────────────────────────────────────────────────── */
.af-toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.af-toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--af-text-secondary);
}

.af-toggle {
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: var(--af-border);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.af-toggle--on { background: var(--af-accent); }
.af-toggle:disabled { opacity: 0.5; cursor: not-allowed; }

.af-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.18s ease;
}

.af-toggle--on .af-toggle-thumb { left: 21px; }

.af-toggle-status {
  font-size: 12px;
  font-weight: 700;
  color: var(--af-text-secondary);
}

.af-toggle-status--on { color: var(--af-accent); }

/* ── Table ─────────────────────────────────────────────────────────────── */
.af-table-wrap {
  overflow-x: auto;
  border-radius: var(--af-radius-md);
  border: 1.5px solid var(--af-border);
}

.af-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.af-table thead { background: var(--af-bg); }

.af-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--af-text-secondary);
  border-bottom: 1.5px solid var(--af-border);
  white-space: nowrap;
}

.af-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--af-border);
  vertical-align: middle;
}

.af-row:last-child td { border-bottom: none; }
.af-row:hover { background: var(--af-bg); }
.af-row--clickable { cursor: pointer; }
.af-row--clickable:focus { outline: 2px solid var(--af-accent); outline-offset: -2px; }

.af-col-num     { width: 80px; text-align: center; }
.af-col-actions { width: 120px; }
.af-cell-num    { text-align: center; }
.af-cell-name   { font-weight: 600; white-space: nowrap; }
.af-cell-rating { white-space: nowrap; }
.af-cell-date   { white-space: nowrap; color: var(--af-text-secondary); font-size: 12px; }

.af-cell-comment { max-width: 200px; }
.af-comment-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--af-text-secondary);
}

/* ── Tags / badges ─────────────────────────────────────────────────────── */
.af-tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(75, 22, 45, 0.08);
  color: var(--af-primary);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.af-status-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.af-status-badge--active   { background: rgba(22, 163, 74, 0.1);  color: #15803D; }
.af-status-badge--inactive { background: rgba(107, 91, 82, 0.1);   color: var(--af-text-secondary); }
.af-status-badge--rejected { background: rgba(220, 38, 38, 0.08);  color: var(--af-error); }

/* ── Stars display ─────────────────────────────────────────────────────── */
.af-stars-display { letter-spacing: -1px; color: var(--af-border); }
.af-star-on { color: var(--af-accent); }

/* ── Score ─────────────────────────────────────────────────────────────── */
.af-score { font-weight: 700; }
.af-score--up   { color: var(--af-accent);  }
.af-score--down { color: var(--af-error);   }

/* ── Action buttons ────────────────────────────────────────────────────── */
.af-cell-actions { white-space: nowrap; }
.af-action-group { display: flex; gap: 6px; align-items: center; }

.af-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--af-radius-sm);
  border: 1.5px solid var(--af-border);
  background: var(--af-surface);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  color: var(--af-text-secondary);
}

.af-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.af-action-btn svg { stroke: currentColor; }

.af-action-btn--accept:hover:not(:disabled)  { background: rgba(22, 163, 74, 0.1); border-color: #16A34A; color: #16A34A; }
.af-action-btn--publish:hover:not(:disabled) { background: rgba(59, 130, 246, 0.1); border-color: #3B82F6; color: #3B82F6; }
.af-action-btn--reject:hover:not(:disabled)  { background: rgba(220, 38, 38, 0.08); border-color: var(--af-error); color: var(--af-error); }
.af-action-btn--edit:hover:not(:disabled)    { background: rgba(75, 22, 45, 0.1); border-color: var(--af-primary); color: var(--af-primary); }

/* ── Inline form ───────────────────────────────────────────────────────── */
.af-inline-form {
  background: var(--af-surface);
  border: 1.5px solid var(--af-sand);
  border-radius: var(--af-radius-md);
  padding: 18px;
  margin-bottom: 20px;
}

.af-inline-form-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--af-primary);
  margin: 0 0 14px;
}

.af-field-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}

.af-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--af-text);
}

.af-required { color: var(--af-error); margin-left: 2px; }

.af-input {
  padding: 9px 12px;
  border: 1.5px solid var(--af-border);
  border-radius: var(--af-radius-sm);
  font-family: var(--af-font);
  font-size: 13px;
  color: var(--af-text);
  background: var(--af-surface);
  transition: border-color 0.15s ease;
}

.af-input--sm { max-width: 100px; }
.af-input:focus { outline: none; border-color: var(--af-accent); }

.af-textarea {
  padding: 9px 12px;
  border: 1.5px solid var(--af-border);
  border-radius: var(--af-radius-sm);
  font-family: var(--af-font);
  font-size: 13px;
  color: var(--af-text);
  resize: vertical;
  transition: border-color 0.15s ease;
}

.af-textarea:focus { outline: none; border-color: var(--af-accent); }

.af-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.af-error-msg {
  font-size: 13px;
  color: var(--af-error);
  padding: 8px 12px;
  background: rgba(220, 38, 38, 0.06);
  border-radius: var(--af-radius-sm);
  border-left: 3px solid var(--af-error);
  margin-bottom: 12px;
}

/* ── Category list ─────────────────────────────────────────────────────── */
.af-category-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.af-category-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--af-surface);
  border: 1.5px solid var(--af-border);
  border-radius: var(--af-radius-md);
}

.af-category-drag-handle {
  font-size: 18px;
  line-height: 1;
  color: var(--af-text-secondary);
  cursor: grab;
  flex-shrink: 0;
  user-select: none;
  padding: 2px 4px;
}

.af-category-drag-handle:active { cursor: grabbing; }

.af-category-row--dragging {
  opacity: 0.45;
}

.af-category-row--over {
  border-color: var(--af-accent);
  background: rgba(206, 102, 50, 0.06);
}

.af-category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.af-category-name { font-size: 14px; font-weight: 600; color: var(--af-text); }
.af-category-desc { font-size: 12px; color: var(--af-text-secondary); }

/* ── Loading / empty ───────────────────────────────────────────────────── */
.af-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 0;
  color: var(--af-text-secondary);
  font-size: 14px;
}

.af-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid var(--af-border);
  border-top-color: var(--af-accent);
  border-radius: 50%;
  animation: af-spin 0.65s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes af-spin { to { transform: rotate(360deg); } }

.af-empty {
  text-align: center;
  padding: 32px 0;
  color: var(--af-text-secondary);
  font-size: 14px;
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
.af-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  padding: 13px 20px;
  border-radius: var(--af-radius-md);
  font-family: var(--af-font);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: af-toast-in 0.2s ease;
  max-width: 360px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.af-toast--error {
  background: #FEF2F2;
  color: #991B1B;
  border: 1.5px solid #FECACA;
}

.af-toast-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  opacity: 0.7;
}

.af-toast-close:hover { opacity: 1; }

@keyframes af-toast-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Pagination ────────────────────────────────────────────────────────── */
.af-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 16px 0 4px;
}

.af-pagination-label {
  font-size: 13px;
  color: var(--af-text-secondary);
  min-width: 60px;
  text-align: center;
}

.af-btn--sm {
  padding: 7px 14px;
  font-size: 13px;
}

/* ── Detail panel ──────────────────────────────────────────────────────── */
.af-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 99;
}

.af-detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  max-width: 100vw;
  height: 100%;
  background: var(--af-surface);
  box-shadow: -4px 0 28px rgba(0, 0, 0, 0.14);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.af-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--af-border);
  position: sticky;
  top: 0;
  background: var(--af-surface);
  z-index: 1;
}

.af-detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--af-primary);
}

.af-detail-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--af-text-secondary);
  padding: 4px 8px;
  border-radius: var(--af-radius-sm);
  transition: background 0.12s ease;
}

.af-detail-close:hover { background: var(--af-bg); }

.af-detail-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.af-detail-stars {
  font-size: 24px;
  letter-spacing: 2px;
  color: var(--af-border);
}

.af-detail-stars .af-star-on { color: var(--af-accent); }

.af-detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.af-detail-name { font-weight: 700; color: var(--af-text); }
.af-detail-sep  { color: var(--af-text-secondary); }
.af-detail-date { font-size: 13px; color: var(--af-text-secondary); }

.af-detail-comment {
  font-size: 15px;
  line-height: 1.65;
  color: var(--af-text);
  margin: 0;
  white-space: pre-wrap;
}

.af-detail-status { display: flex; }

.af-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--af-border);
}

/* Detail panel btn variants */
.af-btn--accept {
  background: rgba(22, 163, 74, 0.1);
  color: #16A34A;
  border: 1.5px solid #16A34A;
  padding: 9px 18px;
  font-family: var(--af-font);
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--af-radius-sm);
  cursor: pointer;
  transition: background 0.12s ease;
}

.af-btn--accept:hover:not(:disabled) { background: rgba(22, 163, 74, 0.18); }
.af-btn--accept:disabled { opacity: 0.4; cursor: not-allowed; }

.af-btn--danger {
  background: rgba(220, 38, 38, 0.08);
  color: var(--af-error);
  border: 1.5px solid var(--af-error);
  padding: 9px 18px;
  font-family: var(--af-font);
  font-size: 13px;
  font-weight: 700;
  border-radius: var(--af-radius-sm);
  cursor: pointer;
  transition: background 0.12s ease;
}

.af-btn--danger:hover:not(:disabled) { background: rgba(220, 38, 38, 0.14); }
.af-btn--danger:disabled { opacity: 0.4; cursor: not-allowed; }

/* Vue transition for detail panel */
.af-detail-slide-enter-active,
.af-detail-slide-leave-active {
  transition: transform 0.25s ease;
}

.af-detail-slide-enter-from,
.af-detail-slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 767px) {
  .af-detail-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 80vh;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 28px rgba(0, 0, 0, 0.14);
  }
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .af-section { padding: 14px; }
  .af-section-header { flex-direction: column; align-items: flex-start; }
  .af-table th, .af-table td { padding: 8px 10px; }
}

@media (min-width: 768px) {
  .af-section { padding: 20px 24px; }
  .af-section-header { gap: 12px; }
}
</style>
