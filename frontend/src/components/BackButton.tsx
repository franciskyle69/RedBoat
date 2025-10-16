import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  label?: string;
};

function BackButton({ label = "Back" }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      style={{ marginBottom: 16 }}
    >
      {label}
    </button>
  );
}

export default BackButton;


    