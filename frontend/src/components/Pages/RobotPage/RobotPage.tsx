import { Typography } from '@equinor/eds-core-react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { BackButton } from 'utils/BackButton'
import { Header } from 'components/Header/Header'
import { RobotImage } from 'components/Displays/RobotDisplays/RobotImage'
import { PressureTable } from './PressureTable'
import { PressureStatusDisplay } from 'components/Displays/RobotDisplays/PressureStatusDisplay'
import { BatteryStatusDisplay } from 'components/Displays/RobotDisplays/BatteryStatusDisplay'
import { RobotStatusChip } from 'components/Displays/RobotDisplays/RobotStatusIcon'
import { RobotStatus } from 'models/Robot'
import { useLanguageContext } from 'components/Contexts/LanguageContext'
import { RobotType } from 'models/RobotModel'
import { useRobotContext } from 'components/Contexts/RobotContext'
import { BackendAPICaller } from 'api/ApiCaller'
import { StyledButton, StyledPage } from 'components/Styles/StyledComponents'
import { AlertType, useAlertContext } from 'components/Contexts/AlertContext'
import { FailedRequestAlertContent, FailedRequestAlertListContent } from 'components/Alerts/FailedRequestAlert'
import { AlertCategory } from 'components/Alerts/AlertsBanner'
import { DocumentationSection } from './Documentation'
import { useMediaStreamContext } from 'components/Contexts/MediaStreamContext'
import { VideoStreamSection } from '../MissionPage/MissionPage'
import { useEffect, useState } from 'react'
import { VideoStreamWindow } from '../MissionPage/VideoStream/VideoStreamWindow'
import { MoveRobotArmSection } from './RobotArmMovement'

const StyledTextButton = styled(StyledButton)`
    text-align: left;
    max-width: 12rem;
`
const RobotInfo = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 3rem;
    width: calc(80vw);
    @media (max-width: 600px) {
        flex-direction: column;
    }
    margin: 0rem 0rem 2rem 0rem;
`
const StatusContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: flex-end;
    gap: 2rem;
    @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
    }
`

export const RobotPage = () => {
    const { TranslateText } = useLanguageContext()
    const { setAlert, setListAlert } = useAlertContext()
    const { robotId } = useParams()
    const { enabledRobots } = useRobotContext()
    const { mediaStreams } = useMediaStreamContext()
    const [videoMediaStreams, setVideoMediaStreams] = useState<MediaStreamTrack[]>([])

    const selectedRobot = enabledRobots.find((robot) => robot.id === robotId)

    const returnRobotToHome = () => {
        if (robotId) {
            BackendAPICaller.returnRobotToHome(robotId).catch((e) => {
                setAlert(
                    AlertType.RequestFail,
                    <FailedRequestAlertContent
                        translatedMessage={TranslateText('Failed to send robot {0} home', [selectedRobot?.name ?? ''])}
                    />,
                    AlertCategory.ERROR
                )
                setListAlert(
                    AlertType.RequestFail,
                    <FailedRequestAlertListContent
                        translatedMessage={TranslateText('Failed to send robot {0} home', [selectedRobot?.name ?? ''])}
                    />,
                    AlertCategory.ERROR
                )
            })
        }
    }

    useEffect(() => {
        if (robotId && mediaStreams && Object.keys(mediaStreams).includes(robotId)) {
            const mediaStreamConfig = mediaStreams[robotId]
            if (mediaStreamConfig && mediaStreamConfig.streams.length > 0)
                setVideoMediaStreams(mediaStreamConfig.streams)
        }
    }, [mediaStreams, robotId])

    return (
        <>
            <Header page={'robot'} />
            <StyledPage>
                <BackButton />
                {selectedRobot && (
                    <>
                        <Typography variant="h1">
                            {selectedRobot.name + ' (' + selectedRobot.model.type + ')'}
                        </Typography>
                        <RobotInfo>
                            <RobotImage height="350px" robotType={selectedRobot.model.type} />
                            <StatusContent>
                                <RobotStatusChip
                                    status={selectedRobot.status}
                                    flotillaStatus={selectedRobot.flotillaStatus}
                                    isarConnected={selectedRobot.isarConnected}
                                    itemSize={32}
                                />

                                {selectedRobot.status !== RobotStatus.Offline && (
                                    <>
                                        <BatteryStatusDisplay
                                            itemSize={32}
                                            batteryLevel={selectedRobot.batteryLevel}
                                            batteryWarningLimit={selectedRobot.model.batteryWarningThreshold}
                                        />
                                        {selectedRobot.pressureLevel !== null &&
                                            selectedRobot.pressureLevel !== undefined && (
                                                <PressureStatusDisplay
                                                    itemSize={32}
                                                    pressure={selectedRobot.pressureLevel}
                                                    upperPressureWarningThreshold={
                                                        selectedRobot.model.upperPressureWarningThreshold
                                                    }
                                                    lowerPressureWarningThreshold={
                                                        selectedRobot.model.lowerPressureWarningThreshold
                                                    }
                                                />
                                            )}
                                    </>
                                )}
                            </StatusContent>
                        </RobotInfo>
                        {selectedRobot.model.type === RobotType.TaurobInspector && <PressureTable />}
                        <Typography variant="h2">{TranslateText('Actions')}</Typography>

                        <StyledTextButton variant="outlined" onClick={returnRobotToHome}>
                            {TranslateText('Return robot to home')}
                        </StyledTextButton>

                        {selectedRobot.model.type === RobotType.TaurobInspector && (
                            <MoveRobotArmSection robot={selectedRobot} />
                        )}
                        {selectedRobot.documentation && selectedRobot.documentation.length > 0 && (
                            <DocumentationSection documentation={selectedRobot.documentation} />
                        )}
                        <VideoStreamSection>
                            {videoMediaStreams && videoMediaStreams.length > 0 && (
                                <VideoStreamWindow videoStreams={videoMediaStreams} />
                            )}
                        </VideoStreamSection>
                    </>
                )}
            </StyledPage>
        </>
    )
}
