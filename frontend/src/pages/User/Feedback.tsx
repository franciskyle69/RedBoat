import { useEffect, useState } from "react";
import "../../styles/main.css";
import UserLayout from "../../components/UserLayout";
import { useNotifications } from "../../contexts/NotificationContext";
import * as FeedbackApi from "../../api/feedback";
import StarRating from "../../components/StarRating";

function Feedback() {
  const { notify } = useNotifications();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FeedbackApi.FeedbackItem[]>([]);
  const [allItems, setAllItems] = useState<FeedbackApi.FeedbackItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [mine, all] = await Promise.all([
          FeedbackApi.getMine(),
          FeedbackApi.getAll(),
        ]);
        setItems(mine);
        setAllItems(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      notify("Please enter your feedback before submitting.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await FeedbackApi.submit(rating, comment.trim());
      notify("Thank you for your feedback!", "success");
      setComment("");
      setRating(5);
      const [mine, all] = await Promise.all([
        FeedbackApi.getMine(),
        FeedbackApi.getAll(),
      ]);
      setItems(mine);
      setAllItems(all);
    } catch (err) {
      console.error(err);
      notify("Failed to submit feedback. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  const averageRating =
    allItems.length === 0
      ? 0
      : allItems.reduce((sum, fb) => sum + fb.rating, 0) / allItems.length;

  return (
    <UserLayout pageTitle="Feedback & Reviews">
      <section className="cards">
        <div className="card feedback-form-card">
          <div className="feedback-form-header">
            <h2>Submit Feedback</h2>
            <p>Share your experience to help us improve our hotel services.</p>
          </div>
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label className="form-label">
                How would you rate your experience?
              </label>
              <div className="rating-container">
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  readonly={submitting}
                  size="large"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Tell us about your experience
              </label>
              <textarea
                className="feedback-textarea"
                rows={6}
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setComment(e.target.value);
                  }
                }}
                placeholder="Share what you enjoyed most about your stay, or let us know how we can improve our services. Your feedback helps us provide better experiences for all our guests."
                disabled={submitting}
                maxLength={500}
              />
              <div className="character-count">
                {comment.length}/500 characters
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                className="btn primary feedback-submit-btn"
                disabled={submitting || !comment.trim()}
              >
                {submitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2>My Reviews</h2>
          {loading ? (
            <p>Loading your feedback...</p>
          ) : items.length === 0 ? (
            <p>You have not submitted any feedback yet.</p>
          ) : (
            <ul className="list">
              {items.map((fb) => (
                <li key={fb._id} className="list-item">
                  <div className="list-item-main">
                    <strong>Rating:</strong>
                    <div style={{ marginLeft: '8px', display: 'inline-block' }}>
                      <StarRating rating={fb.rating} readonly size="small" />
                    </div>
                  </div>
                  <div className="list-item-sub">
                    {fb.comment}
                  </div>
                  <div className="list-item-meta">
                    {formatDate(fb.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>Guest Reviews</h2>
          {loading ? (
            <p>Loading guest reviews...</p>
          ) : allItems.length === 0 ? (
            <p>No reviews have been submitted yet.</p>
          ) : (
            <>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <StarRating rating={averageRating} readonly size="medium" />
                <span>
                  <strong>{averageRating.toFixed(1)}</strong>/5 ({allItems.length} review
                  {allItems.length !== 1 ? "s" : ""})
                </span>
              </div>
              <ul className="list">
                {allItems.map((fb) => (
                  <li key={fb._id} className="list-item">
                    <div className="list-item-main">
                      <strong>Rating:</strong>
                      <div style={{ marginLeft: '8px', display: 'inline-block' }}>
                        <StarRating rating={fb.rating} readonly size="small" />
                      </div>
                    </div>
                    <div className="list-item-sub">
                      {fb.comment}
                    </div>
                    <div className="list-item-meta">
                      {formatDate(fb.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </UserLayout>
  );
}

export default Feedback;
