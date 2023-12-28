import "./NavbarLogout.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import GEVS from "../assets/vote.svg";
import axios from "../utils/axios";

function NavbarComp() {
  const navigate = useNavigate();

  const handleClick2 = () => {
    navigate("/UserDashboard");
  };

  const handleClick = () => {
    axios
      .get("/logout")
      .then((res) => {
        toast.success("Logged out successfully", {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        navigate("/login");
      })
      .catch((err) => {
        toast.error(err.response.data.message, {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        navigate("/login");
      });
  };
  return (
    <>
      <div className="navOutter">
        <div className="nav" onClick={handleClick2}>
          <img
            alt="GEVS"
            src={GEVS}
            width="50"
            height="50"
            className="d-inline-block align-top"
          />{" "}
          <h1>GEVS</h1>
        </div>
        <div className="logoutBtn">
          <Stack spacing={2} direction="row">
            <Button variant="contained" onClick={handleClick}>
              Logout
            </Button>
          </Stack>
        </div>
      </div>
    </>
  );
}

export default NavbarComp;
