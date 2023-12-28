import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import GEVS from "../assets/vote.svg";

function NavbarComp() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/UserDashboard");
  };

  return (
    <>
      <div className="nav" onClick={handleClick}>
        <img
          alt="GEVS"
          src={GEVS}
          width="50"
          height="50"
          className="d-inline-block align-top"
        />{" "}
        <h1>GEVS</h1>
      </div>
    </>
  );
}

export default NavbarComp;
