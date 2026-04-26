from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess, LogInfo, RegisterEventHandler, TimerAction
from launch.conditions import IfCondition
from launch.event_handlers import OnProcessStart
from launch.substitutions import LaunchConfiguration


def generate_launch_description():
    use_cameras = LaunchConfiguration('use_cameras')
    use_web_interface = LaunchConfiguration('use_web_interface')
    use_localstorage = LaunchConfiguration('use_localstorage')
    use_server = LaunchConfiguration('use_server')
    use_robot_browser = LaunchConfiguration('use_robot_browser')
    use_rosbridge = LaunchConfiguration('use_rosbridge')
    robocasa_layout = LaunchConfiguration('robocasa_layout')
    robocasa_style = LaunchConfiguration('robocasa_style')
    use_rviz = LaunchConfiguration('use_rviz')

    mujoco_process = ExecuteProcess(
        cmd=[
            'bash', '-lc',
            [
                'export MUJOCO_GL=egl && ',
                'ros2 launch stretch_simulation stretch_mujoco_driver.launch.py ',
                'use_mujoco_viewer:=false ',
                'mode:=position ',
                'use_rviz:=', use_rviz, ' ',
                'use_cameras:=', use_cameras, ' ',
                'robocasa_layout:="', robocasa_layout, '" ',
                'robocasa_style:="', robocasa_style, '"',
            ]
        ],
        output='screen'
    )

    browser_process = ExecuteProcess(
        cmd=[
            'bash', '-lc',
            'cd ~/ament_ws/src/stretch_web_teleop && node start_robot_browser.js'
        ],
        condition=IfCondition(use_robot_browser),
        output='screen'
    )

    return LaunchDescription([
        DeclareLaunchArgument('use_cameras', default_value='true'),
        DeclareLaunchArgument('use_web_interface', default_value='true'),
        DeclareLaunchArgument('use_localstorage', default_value='true'),
        DeclareLaunchArgument('use_server', default_value='true'),
        DeclareLaunchArgument('use_robot_browser', default_value='true'),
        DeclareLaunchArgument('use_rosbridge', default_value='false'),
        DeclareLaunchArgument('robocasa_layout', default_value='One wall'),
        DeclareLaunchArgument('robocasa_style', default_value='Industrial'),
        DeclareLaunchArgument('use_rviz', default_value='false'),

        LogInfo(msg='Starting Stretch sim full stack...'),

        mujoco_process,

        ExecuteProcess(
            cmd=[
                'bash', '-lc',
                'ros2 launch stretch_simulation stretch_simulation_web_interface.launch.py'
            ],
            condition=IfCondition(use_web_interface),
            output='screen'
        ),

        ExecuteProcess(
            cmd=[
                'bash', '-lc',
                'cd ~/ament_ws/src/stretch_web_teleop && npm run localstorage'
            ],
            condition=IfCondition(use_localstorage),
            output='screen'
        ),

        ExecuteProcess(
            cmd=[
                'bash', '-lc',
                'cd ~/ament_ws/src/stretch_web_teleop && sudo node ./server.js'
            ],
            condition=IfCondition(use_server),
            output='screen'
        ),

        RegisterEventHandler(
            OnProcessStart(
                target_action=mujoco_process,
                on_start=[
                    LogInfo(msg='MuJoCo launch started. Waiting 20 seconds before opening robot browser...'),
                    TimerAction(
                        period=20.0,
                        actions=[browser_process]
                    ),
                ],
            )
        ),

        ExecuteProcess(
            cmd=[
                'bash', '-lc',
                'ros2 launch rosbridge_server rosbridge_websocket_launch.xml'
            ],
            condition=IfCondition(use_rosbridge),
            output='screen'
        ),
    ])
