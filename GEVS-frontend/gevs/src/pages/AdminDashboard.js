import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/NavbarLogout";
import "./AdminDashboard.css";
import axios from "../utils/axios";
import UserAccount from "../assets/circle-user-round.svg";
import FormControlLabel from "@mui/material/FormControlLabel";
import { styled } from "@mui/material/styles";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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

function AdminDashboard() {
  const cookieValue = decodeURIComponent(document.cookie);
  const email = cookieValue.match(new RegExp(`email=([^;]+)`));
  const [val, setVal] = useState(0);
  const [winner, setWinner] = useState("Pending...");
  const [limit, setLimit] = useState(30);
  const [limit2, setLimit2] = useState(30);
  const [dataVal, setDataval] = useState({ labels: [], datasets: [] });
  const [extraDataVal, setExtraDataval] = useState();
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/election-status")
      .then((res) => {
        setVal(res.data.election);
        setWinner(res.data.winner);

        axios("/admindata")
          .then((res) => {
            const data = transformData(res.data);
            setDataval(data);
            setExtraDataval(res.data);
            setChartData(data);
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
  }, []);

  const colorMap = [
    {
      1: "red",
      2: "blue",
      3: "yellow",
      4: "green",
      5: "aqua",
      6: "purple",
      7: "lightgreen",
    },
  ];

  const transformData = (data) => {
    const constituencies = [...new Set(data.map((item) => item.constituency))];
    const parties = [...new Set(data.map((item) => item.party))];
    let i = 1;
    const datasets = parties.map((party) => ({
      label: party,
      data: constituencies.map((constituency) => {
        const item = data.find(
          (item) => item.constituency === constituency && item.party === party
        );
        item
          ? item.vote_count > limit && setLimit(item.vote_count + 50)
          : setLimit2(null);
        return item ? item.vote_count : 0;
      }),
      backgroundColor: colorMap[0][i++],
    }));
    return { labels: constituencies, datasets };
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Each party in the corresponding constituency",
          color: "black",
          font: {
            size: 14,
          },
        },
        ticks: {
          color: "black",
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        max: limit,
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
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
        },
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

  const handleChange = (event) => {
    const voteValue = {
      val: !val,
    };
    axios
      .post("/election", voteValue)
      .then((res) => {
        setVal(res.data.election);
        setWinner(res.data.winner);

        axios("/admindata")
          .then((res) => {
            const data = transformData(res.data);
            setDataval(data);
            setExtraDataval(res.data);
            setChartData(data);
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

  const Android12Switch = styled(Switch)(({ theme }) => ({
    padding: 8,
    "& .MuiSwitch-track": {
      borderRadius: 22 / 2,
      "&:before, &:after": {
        content: '""',
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        width: 16,
        height: 16,
      },
      "&:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          theme.palette.getContrastText(theme.palette.primary.main)
        )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
        left: 12,
      },
      "&:after": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          theme.palette.getContrastText(theme.palette.primary.main)
        )}" d="M19,13H5V11H19V13Z" /></svg>')`,
        right: 12,
      },
    },
    "& .MuiSwitch-thumb": {
      boxShadow: "none",
      width: 16,
      height: 16,
      margin: 2,
    },
  }));

  return (
    <div>
      <div>
        <div className="adminDahboardOutter">
          <Navbar />
          <div className="adminDashboard">
            <img src={UserAccount} alt="User" width="40" height="40" />
            <h3>
              Hello,{" "}
              {email[1] != null ? email[1] : <pre>"Something went wrong"</pre>}
            </h3>
            <div>
              <FormGroup>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Election Status:</Typography>
                  <FormControlLabel
                    control={<Android12Switch />}
                    onClick={handleChange}
                    checked={val}
                  />
                </Stack>
              </FormGroup>
            </div>
            <div className="status">
              {!val ? <div>" Election is closed now "</div> : null}
              {!val ? <div>" Winner : {winner} "</div> : null}
            </div>
            <p></p>
            <div className="App">
              <div>
                <Bar
                  className="barChart"
                  data={chartData}
                  options={options}
                  plugins={[ChartDataLabels]}
                />
              </div>
            </div>

            <br />
            <div className="table">
              <h3>Details of each party in the corresponding constituency</h3>
              {(() => {
                const arr = [];
                for (let i = 0; i < dataVal.labels.length; i++) {
                  arr.push(
                    <>
                      <h4>{dataVal.labels[i]}</h4>
                      <table key={dataVal.labels[i]}>
                        <thead>
                          <th>Party</th>
                          <th>Candidate</th>
                          <th>Vote Count</th>
                        </thead>
                        <tbody>
                          {(() => {
                            const arr1 = [];
                            for (let j = 0; j < extraDataVal.length; j++) {
                              if (
                                extraDataVal[j].constituency ===
                                dataVal.labels[i]
                              ) {
                                arr1.push(
                                  <>
                                    <tr>
                                      <td>{extraDataVal[j].party}</td>
                                      <td>{extraDataVal[j].candidate}</td>
                                      <td>{extraDataVal[j].vote_count}</td>
                                    </tr>
                                  </>
                                );
                              }
                            }
                            return arr1;
                          })()}
                        </tbody>
                      </table>
                      <br />
                    </>
                  );
                }
                return arr;
              })()}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default AdminDashboard;
