import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/NavbarLogout";
import "./UserDashboard.css";
import axios from "../utils/axios";
import UserAccount from "../assets/circle-user-round.svg";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";

Chart.register(
  BarController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement
);

function UserDashboard() {
  const [labelData, setlabelData] = useState([]);
  const [barData, setbarData] = useState([]);
  const [value, setValue] = useState("");
  const [vote, setVote] = useState();
  const [election, setElection] = useState(1);
  const [winner, setWinner] = useState("waiting...");
  const [constituency, setConstituency] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [userName, setUsername] = useState("");
  const navigate = useNavigate();

  const handleChange = (event) => {
    setValue(event.target.value);
    setWarningMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log(value);
    if (value === "") {
      setWarningMessage("Please select an option before submitting.");
      return;
    }
    const answer = window.confirm(`Confirm your choice : ${value}`);
    if (answer) {
      setWarningMessage("");

      console.log(value);
      const voteVal = {
        party: value,
      };
      await axios
        .post("/vote", voteVal)
        .then((res) => {
          console.log(res);
          toast.success("You have voted successfully", {
            position: "top-center",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });

          axios
            .get("/userdata")
            .then((res) => {
              const elec = res.data.pop();
              const data1 = res.data.pop();
              setElection(elec.election);
              setWinner(elec.winner);
              setVote(data1[0].voted);
              setConstituency(data1[0].constituency);
              setUsername(data1[0].full_name);
              setbarData(res.data.map((item) => item.votes));
              setlabelData(
                res.data.map((item) => [item.party, item.candidate])
              );
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
        })
        .catch((err) => {
          const outpt = err.response.data.message;
          toast.error(outpt, {
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
    } else {
      toast.error("Your vote was not submitted", {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await axios
        .get("/userdata")
        .then((res) => {
          const elec = res.data.pop();
          const data1 = res.data.pop();
          setElection(elec.election);
          setWinner(elec.winner);
          setConstituency(data1[0].constituency);
          setVote(data1[0].voted);
          setUsername(data1[0].full_name);
          setbarData(res.data.map((item) => item.votes));
          setlabelData(res.data.map((item) => [item.party, item.candidate]));
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
    fetchData();
  }, []);

  const options = {
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: "black",
          font: {
            size: 14,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: Math.max(...barData) + Math.round(Math.max(...barData) / 6 + 1),
        title: {
          display: true,
          text: "Number of votes",
          color: "black",
          font: {
            size: 14,
          },
        },
        ticks: {
          color: "black",
          font: {
            size: 14,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (value, context) => value,
        color: "black",
        display: "auto",
        font: {
          size: 13,
        },
      },
    },
  };

  const labels = labelData;

  const data = {
    labels,
    datasets: [
      {
        label: "Number of votes",
        data: barData,
        backgroundColor: ["aqua", "green", "red", "yellow", "purple"],
        borderColor: ["aqua", "green", "red", "yellow", "green"],
        borderWidth: 0.5,
      },
    ],
  };

  return (
    <div>
      <div>
        <div className="userDahboardOutter">
          <Navbar />
          <div className="userDashboard">
            <img src={UserAccount} alt="User" width="40" height="40" />
            <h3>
              Hello,{" "}
              {userName !== "" ? userName : <pre>"Something went wrong"</pre>}
            </h3>
            <p>
              Your constituency is <i>{constituency}</i>
            </p>
            <div className="status">
              {election ? <div>" Election is closed now "</div> : null}
              {election ? <div>" Winner : {winner} "</div> : null}
            </div>
            <div className="App">
              <div style={{ maxWidth: "650px" }}>
                <Bar
                  data={data}
                  height={400}
                  options={options}
                  plugins={[ChartDataLabels]}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="userFrom">
              <FormControl>
                <FormLabel id="demo-controlled-radio-buttons-group">
                  Select your choice of vote
                </FormLabel>
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  id="value1"
                  value={value}
                  onChange={handleChange}
                >
                  {labelData.map((item) => {
                    return (
                      <FormControlLabel
                        value={item[0]}
                        control={<Radio />}
                        label={`${item[1]} from ${item[0]}`}
                      />
                    );
                  })}
                </RadioGroup>

                {warningMessage && (
                  <div className="warning">{warningMessage}</div>
                )}
                {vote ? (
                  <Button variant="contained" type="submit" disabled>
                    You have already voted
                  </Button>
                ) : (
                  <Button variant="contained" type="submit">
                    Submit your vote
                  </Button>
                )}
              </FormControl>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default UserDashboard;
